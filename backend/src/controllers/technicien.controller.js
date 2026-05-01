const prisma = require("../prismaClient");
const {
  notifyEmployeeStatusChanged,
  notifyEmployeeSolution,
  notifyEmployeeInfoRequest,
  notifyTechAssigned,
  notifyAllManagersOfService,
  notifyAllTechsOfService,
 notifyEmployeeRedirected,  
} = require("./notification.service");

// ── GET détail ticket technicien ───────────────────────────────────────────
const getTicketDetailTech = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_created_byTousers: {
          select: {
            id: true, name: true, surname: true, email: true,
            department: true, job_title: true, phone: true,
            office: true, block_number: true, role: true,
          },
        },
        users_tickets_assigned_toTousers: {
          select: { id: true, name: true, surname: true, email: true, phone: true },
        },
        services: { select: { id: true, name: true } },
        ticket_assignments_history: {
          orderBy: { created_at: "desc" },
          take: 5,
          include: {
            users_ticket_assignments_history_assigned_byTousers: {
              select: { id: true, name: true, surname: true, role: true },
            },
            users_ticket_assignments_history_from_user_idTousers: {
              select: { id: true, name: true, surname: true },
            },
          },
        },
        ticket_comments: {
          orderBy: { created_at: "asc" },
          include: {
            users: { select: { id: true, name: true, surname: true, role: true } },
            ticket_attachments: true,
          },
        },
        ticket_attachments: {
          orderBy: { uploaded_at: "asc" },
          include: {
            users: { select: { id: true, name: true, surname: true } },
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: "Ticket non trouvé" });

    // ── assignedBy : premier assignment (asc) ─────────────────────────────
    const firstAssignment = [...ticket.ticket_assignments_history]
      .reverse()
      .find(h => h.action !== "redirect");
    let assignedBy = { label: "Auto / Système", type: "auto" };
    if (firstAssignment?.users_ticket_assignments_history_assigned_byTousers) {
      const u = firstAssignment.users_ticket_assignments_history_assigned_byTousers;
      assignedBy = {
        id: u.id, name: u.name, surname: u.surname,
        role: u.role,
        label: `${u.name} ${u.surname}`.trim(),
        type: "manager",
      };
    }

    // ── redirectInfo : dernière redirection ───────────────────────────────
    const lastRedirect = ticket.ticket_assignments_history.find(h => h.action === "redirect");
    const redirectInfo = lastRedirect ? {
      by: lastRedirect.users_ticket_assignments_history_assigned_byTousers
        ? `${lastRedirect.users_ticket_assignments_history_assigned_byTousers.name} ${lastRedirect.users_ticket_assignments_history_assigned_byTousers.surname}`.trim()
        : "Inconnu",
      from: lastRedirect.users_ticket_assignments_history_from_user_idTousers
        ? `${lastRedirect.users_ticket_assignments_history_from_user_idTousers.name} ${lastRedirect.users_ticket_assignments_history_from_user_idTousers.surname}`.trim()
        : null,
      reason: lastRedirect.reason,
      date: lastRedirect.created_at,
    } : null;

    res.json({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      impact: ticket.impact,
      urgency: ticket.urgency,
      sla_date_limite: ticket.sla_date_limite,
      sla_date_debut: ticket.sla_date_debut,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      assignedAt: ticket.assigned_at,
      closedAt: ticket.closed_at,
      solution: ticket.solution,
      sla_statut: ticket.sla_statut,
      redirect_note: ticket.redirect_note,
      redirectInfo,                          // ← ici, au bon niveau
      sla_pause_elapsed_ms: ticket.sla_pause_elapsed_ms ? Number(ticket.sla_pause_elapsed_ms) : null,
      closing_note: ticket.closing_note,
      is_resolved_confirmed: ticket.is_resolved_confirmed,
      confirmation_requested: ticket.confirmation_requested,
      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name ?? null,
      serviceId: ticket.services?.id ?? null,
      assignedBy,
      comments: (ticket.ticket_comments || []).map((c) => ({
        id: c.id,
        message: c.comment,
        comment_type: c.comment_type ?? "comment",
        author: `${c.users?.name ?? ""} ${c.users?.surname ?? ""}`.trim(),
        authorRole: c.users?.role ?? "",
        authorId: c.users?.id,
        date: c.created_at,
        files: (c.ticket_attachments || []).map(a => {
          const relativePath = a.file_path
            ? a.file_path.replace(/^.*[\\\/]uploads[\\\/]/, "uploads/").replace(/\\/g, "/")
            : null;
          return {
            id: a.id,
            fileName: a.file_name,
            filePath: relativePath,
          };
        }),
      })),
      attachments: [
        ...(ticket.ticket_attachments || []),
        ...(ticket.ticket_comments || []).flatMap(c => c.ticket_attachments || [])
      ].map((a) => ({
        id: a.id,
        fileName: a.file_name,
        filePath: a.file_path,
        uploadedBy: `${a.users?.name ?? ""} ${a.users?.surname ?? ""}`.trim(),
        uploadedAt: a.uploaded_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};



// ── PUT statut ─────────────────────────────────────────────────────────────
const updateTicketStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, technicianId } = req.body;

    const valid = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Statut invalide" });

    const PAUSED   = ["pending", "pending_supplier"];
    const TERMINAL = ["resolved", "closed", "rejected"];

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      select: {
        status: true,
        sla_date_limite: true,
        sla_date_debut: true,
        sla_pause_elapsed_ms: true,
        title: true,
        created_by: true,
      },
    });

    const now = new Date();
    const wasPaused = PAUSED.includes(ticket.status);
    let extra = {};

    if (PAUSED.includes(status) && !wasPaused) {
      // → mise en pause : on sauvegarde les ms déjà consommées
      const elapsed = now.getTime() - new Date(ticket.sla_date_debut).getTime();
      extra.sla_pause_elapsed_ms = BigInt(Math.max(0, elapsed));
      extra.sla_statut = "pause";
    }

    else if (!PAUSED.includes(status) && wasPaused) {
      // → reprise : on recalcule sla_date_limite avec le temps restant réel
      const slaWindow = ticket.sla_date_limite
        ? new Date(ticket.sla_date_limite).getTime() - new Date(ticket.sla_date_debut).getTime()
        : 24 * 3600 * 1000;
      const elapsed   = Number(ticket.sla_pause_elapsed_ms ?? 0);
      const remaining = Math.max(0, slaWindow - elapsed);
      extra.sla_date_limite        = new Date(now.getTime() + remaining);
      extra.sla_date_debut         = now;
      extra.sla_pause_elapsed_ms   = null;
      extra.sla_statut             = "en_cours";
    }

    else if (TERMINAL.includes(status)) {
      const exceeded = ticket.sla_date_limite && now > new Date(ticket.sla_date_limite);
      extra.sla_statut = exceeded ? "depasse" : "respecte";
      extra.closed_at  = now;
    }

    const STATUS_FR = {
      open: "Ouvert", in_progress: "En cours", pending: "En attente",
      pending_supplier: "Att. fournisseur", resolved: "Résolu",
      closed: "Fermé", rejected: "Rejeté",
    };

    await prisma.tickets.update({
      where: { id },
      data: { status, updated_at: now, ...extra },
    });

    if (technicianId) {
      await prisma.ticket_comments.create({
        data: {
          ticket_id: id,
          user_id: parseInt(technicianId),
          comment: `history.statusChanged:${status}`,
          comment_type: "status",
          created_at: now,
        },
      });
    }

    if (ticket.created_by) {
      await notifyEmployeeStatusChanged(ticket.created_by, id, ticket.title, status);
    }

    res.json({ success: true, status, sla_statut: extra.sla_statut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── POST envoyer solution / info ───────────────────────────────────────────
const sendSolution = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { message, technicianId, type } = req.body;

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      select: { created_by: true, title: true },
    });

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(technicianId),
        comment: message,
        comment_type: type === "solution" ? "solution" : "info",
        created_at: new Date(),
      },
    });

    if (type === "solution") {
      await prisma.tickets.update({
        where: { id },
        data: {
          solution: message,
          confirmation_requested: false,
          is_resolved_confirmed: false,
          updated_at: new Date(),
        },
      });
      // ── Notifier l'employé : solution envoyée ──
      if (ticket.created_by) {
        await notifyEmployeeSolution(ticket.created_by, id, ticket.title);
      }
    } else {
      await prisma.tickets.update({
        where: { id },
        data: { updated_at: new Date() },
      });
      // ── Notifier l'employé : demande d'info ──
      if (ticket.created_by) {
        await notifyEmployeeInfoRequest(ticket.created_by, id, ticket.title);
      }
    }

    const files = req.files ?? [];
    if (files.length > 0) {
      await prisma.ticket_attachments.createMany({
        data: files.map((f) => ({
          ticket_id: id,
          comment_id: comment.id,
          file_name: f.originalname,
          file_path: f.path,
          uploaded_by: parseInt(technicianId),
          uploaded_at: new Date(),
        })),
      });
    }

    res.json({
      success: true,
      commentId: comment.id,
      filesUploaded: files.length,
      files: files.map(f => ({ fileName: f.originalname, filePath: f.path })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
};

// ── PUT demande de confirmation ────────────────────────────────────────────
const requestConfirmation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { technicianId } = req.body;

    await prisma.tickets.update({
      where: { id },
      data: { confirmation_requested: true, updated_at: new Date() },
    });

    await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(technicianId),
        comment: "history.confirmationRequested",
        comment_type: "confirm",
        created_at: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── PUT fermer manuellement ────────────────────────────────────────────────
const closeTicketManually = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { technicianId, closingNote, solution } = req.body;

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      select: { sla_date_limite: true, created_by: true, title: true },
    });

    const now = new Date();
    const sla_statut = ticket.sla_date_limite && now <= ticket.sla_date_limite
      ? "respecte" : "depasse";

    await prisma.tickets.update({
      where: { id },
      data: {
        status: "closed",
        closing_note: closingNote ?? null,
        ...(solution && { solution }),   // ← enregistre la solution
        sla_statut,
        updated_at: now,
        closed_at: now,
      },
    });

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(technicianId),
comment: closingNote
  ? `history.ticketClosedWithNote:${closingNote}`
  : "history.ticketClosed",
        comment_type: "comment",
        created_at: now,
      },
    });

    // ← attache les fichiers au comment de fermeture
    const files = req.files ?? [];
    console.log("FILES REÇUS close-manual:", files.length);
    if (files.length > 0) {
      await prisma.ticket_attachments.createMany({
        data: files.map((f) => ({
          ticket_id: id,
          comment_id: comment.id,
          file_name: f.originalname,
          file_path: f.path,
          uploaded_by: parseInt(technicianId),
          uploaded_at: now,
        })),
      });
    }

    if (ticket.created_by) {
      await notifyEmployeeStatusChanged(ticket.created_by, id, ticket.title, "closed");
    }

    res.json({ success: true, sla_statut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── PUT rediriger ──────────────────────────────────────────────────────────
const redirectTicket = async (req, res) => {
   console.log("🔁 redirectTicket appelé, body:", req.body);
  try {
    const id = parseInt(req.params.id);
    const { newTechId, newServiceId, newCategory, note, assignedById } = req.body;

    if (!newServiceId) {
      return res.status(400).json({ error: "Le service est obligatoire." });
    }
    if (!note?.trim()) {
      return res.status(400).json({ error: "La raison est obligatoire." });
    }

    const current = await prisma.tickets.findUnique({
      where: { id },
      select: { assigned_to: true, service_id: true, title: true, created_by: true },
    });

    // Récupérer infos du technicien qui redirige (pour afficher "par qui")
    const redirectedBy = assignedById ? await prisma.users.findUnique({
      where: { id: parseInt(assignedById) },
      select: { name: true, surname: true },
    }) : null;
    const redirectedByName = redirectedBy
      ? `${redirectedBy.name} ${redirectedBy.surname}`.trim()
      : "Inconnu";

    // ── Mise à jour du ticket ──────────────────────────────────────────────
    await prisma.tickets.update({
      where: { id },
      data: {
        assigned_to: newTechId ? parseInt(newTechId) : null, // ← désasigne l'ancien toujours
       assigned_at: newTechId ? new Date() : null,
        service_id:  parseInt(newServiceId),
        ...(newCategory && { category: newCategory }),
        redirect_note: `${note} (par ${redirectedByName})`,
        updated_at: new Date(),
      },
    });
  console.log("✅ assigned_to mis à:", newTechId ? parseInt(newTechId) : null);
    // ── Historique ────────────────────────────────────────────────────────
    await prisma.ticket_assignments_history.create({
      data: {
        ticket_id:       id,
        from_user_id:    current.assigned_to,
        to_user_id:      newTechId ? parseInt(newTechId) : null,
        from_service_id: current.service_id,
        to_service_id:   parseInt(newServiceId),
        action:          "redirect",
        reason:          note,
        assigned_by:     assignedById ? parseInt(assignedById) : null,
        created_at:      new Date(),
      },
    });

    // ── Commentaire visible dans la conversation ──────────────────────────
    await prisma.ticket_comments.create({
      data: {
        ticket_id:    id,
        user_id:      assignedById ? parseInt(assignedById) : null,
        comment: `history.ticketRedirected:${redirectedByName}:${note}`,
        comment_type: "redirect",
        created_at:   new Date(),
      },
    });

    // ── Notifications ─────────────────────────────────────────────────────
   // APRÈS
if (current.created_by) {
  await notifyEmployeeRedirected(current.created_by, id, current.title); // ← notif dédiée
}
if (newTechId) {
  await notifyTechAssigned(parseInt(newTechId), id, current.title);
}
const svc = await prisma.services.findUnique({
  where: { id: parseInt(newServiceId) },
  select: { id: true },
});
if (svc) {
  await notifyAllTechsOfService(svc.id, id, current.title);
  await notifyAllManagersOfService(svc.id, id, current.title);
}

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la redirection" });
  }
};
// ── GET services ───────────────────────────────────────────────────────────
const getServices = async (req, res) => {
  try {
    const services = await prisma.services.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET techniciens ────────────────────────────────────────────────────────
const getAllTechniciens = async (req, res) => {
  try {
    const techs = await prisma.users.findMany({
      where: { role: "technician", is_active: true },
      select: { id: true, name: true, surname: true, email: true, phone: true },
      orderBy: { name: "asc" },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET tickets assignés ───────────────────────────────────────────────────
const getAssignedTickets = async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);
    const tickets = await prisma.tickets.findMany({
      where: { assigned_to: techId },
      select: {
        id: true, title: true, description: true,
        priority: true, category: true, status: true,
        created_at: true, sla_date_limite: true, sla_date_debut: true,
         assigned_at: true,        // ← ajouter
  closed_at: true,
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
        sla_pause_elapsed_ms: true,
sla_statut: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.json(tickets.map(t => ({
      id:            t.id,
      title:         t.title,
      description:   t.description,
      priority:      t.priority,
      category:      t.category,
      status:        t.status,
      created_at:    t.created_at,
        assigned_at:     t.assigned_at,   // ← ajouter
  closed_at:       t.closed_at,
      sla_date_limite: t.sla_date_limite,
      sla_date_debut:  t.sla_date_debut,
      sla_pause_elapsed_ms: t.sla_pause_elapsed_ms ? Number(t.sla_pause_elapsed_ms) : null,
sla_statut: t.sla_statut,
      employee_name: `${t.users_tickets_created_byTousers?.name ?? ""} ${t.users_tickets_created_byTousers?.surname ?? ""}`.trim(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET enums ──────────────────────────────────────────────────────────────
const getEnums = async (req, res) => {
  try {
    const [statuts, priorites, categories] = await Promise.all([
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`,
    ]);
    res.json({
      statuts:    statuts.map(r => r.enumlabel),
      priorites:  priorites.map(r => r.enumlabel),
      categories: categories.map(r => r.enumlabel),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// DELETE /api/tech/attachments/:id
const deleteAttachment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const file = await prisma.ticket_attachments.findUnique({
      where: { id },
    });

    if (!file) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    // supprimer fichier du disque
    const fs = require("fs");
    if (file.file_path && fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // supprimer en DB
    await prisma.ticket_attachments.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression fichier" });
  }
};

module.exports = {
  getTicketDetailTech,
  updateTicketStatus,
  sendSolution,
  requestConfirmation,
  closeTicketManually,
  redirectTicket,
  getServices,
  getAllTechniciens,
  getAssignedTickets,
  getEnums,
  deleteAttachment,
};