const prisma = require("../prismaClient");
const {
  notifyEmployeeStatusChanged,
  notifyEmployeeSolution,
  notifyEmployeeInfoRequest,
  notifyTechAssigned,
  notifyAllManagersOfService,
  notifyAllTechsOfService,
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
          orderBy: { created_at: "asc" },
          take: 1,
          include: {
            users_ticket_assignments_history_assigned_byTousers: {
              select: { id: true, name: true, surname: true, email: true, phone: true, role: true },
            },
          },
        },
ticket_comments: {
  orderBy: { created_at: "asc" },
  include: {
    users: { select: { id: true, name: true, surname: true, role: true } }
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

    const firstAssignment = ticket.ticket_assignments_history[0];
    let assignedBy = { label: "Auto / Système", type: "auto" };
    if (firstAssignment?.users_ticket_assignments_history_assigned_byTousers) {
      const u = firstAssignment.users_ticket_assignments_history_assigned_byTousers;
      assignedBy = {
        id: u.id, name: u.name, surname: u.surname,
        email: u.email, phone: u.phone, role: u.role,
        label: `${u.name} ${u.surname}`.trim(),
        type: "manager",
      };
    }

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
      solution: ticket.solution,
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
      fileName: a.file_name,
      filePath: relativePath,
    };
  }),
})),

attachments: (ticket.ticket_attachments || []).map((a) => ({
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

    const STATUTS_FERMES = ["resolved", "closed", "rejected"];
    let sla_statut = undefined;

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      select: { sla_date_limite: true, title: true, created_by: true },
    });

    if (STATUTS_FERMES.includes(status)) {
      const now = new Date();
      sla_statut = ticket.sla_date_limite && now <= ticket.sla_date_limite
        ? "respecte" : "depasse";
    }

    const STATUS_FR = {
      open: "Ouvert", in_progress: "En cours", pending: "En attente",
      pending_supplier: "Att. fournisseur", resolved: "Résolu",
      closed: "Fermé", rejected: "Rejeté",
    };

    const now = new Date();

    await prisma.tickets.update({
      where: { id },
      data: { status, ...(sla_statut && { sla_statut }), updated_at: now },
    });

    if (technicianId) {
      await prisma.ticket_comments.create({
        data: {
          ticket_id: id,
          user_id: parseInt(technicianId),
          comment: `Statut changé en : ${STATUS_FR[status] ?? status}`,
          comment_type: "status",
          created_at: now,
        },
      });
    }

    // ── Notifier l'employé du changement de statut ──
    if (ticket.created_by) {
      await notifyEmployeeStatusChanged(ticket.created_by, id, ticket.title, status);
    }

    res.json({ success: true, status, sla_statut });
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
        comment: "Demande de confirmation de résolution envoyée à l'employé.",
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
    const { technicianId, closingNote } = req.body;

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      select: { sla_date_limite: true, created_by: true, title: true },
    });

    const now = new Date();
    const sla_statut = ticket.sla_date_limite && now <= ticket.sla_date_limite
      ? "respecte" : "depasse";

    await prisma.tickets.update({
      where: { id },
      data: { status: "closed", closing_note: closingNote ?? null, sla_statut, updated_at: now },
    });

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(technicianId),
        comment: closingNote
          ? `Ticket fermé manuellement. Note : ${closingNote}`
          : "Ticket fermé manuellement par le technicien.",
        comment_type: "comment",
        created_at: now,
      },
    });

    const files = req.files ?? [];
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

    // ── Notifier l'employé : ticket fermé ──
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
  try {
    const id = parseInt(req.params.id);
    const { newTechId, newServiceId, newCategory, note, assignedById } = req.body;

    const current = await prisma.tickets.findUnique({
      where: { id },
      select: { assigned_to: true, service_id: true, title: true },
    });

    await prisma.tickets.update({
      where: { id },
      data: {
        ...(newTechId    && { assigned_to: parseInt(newTechId) }),
        ...(newServiceId && { service_id: parseInt(newServiceId) }),
        ...(newCategory  && { category: newCategory }),
        updated_at: new Date(),
      },
    });

    await prisma.ticket_assignments_history.create({
      data: {
        ticket_id:       id,
        from_user_id:    current.assigned_to,
        to_user_id:      newTechId    ? parseInt(newTechId)    : null,
        from_service_id: current.service_id,
        to_service_id:   newServiceId ? parseInt(newServiceId) : null,
        action:          "redirect",
        reason:          note ?? null,
        assigned_by:     assignedById ? parseInt(assignedById) : null,
        created_at:      new Date(),
      },
    });

    const tech = newTechId ? await prisma.users.findUnique({
      where: { id: parseInt(newTechId) },
      select: { name: true, surname: true },
    }) : null;

    const svc = newServiceId ? await prisma.services.findUnique({
      where: { id: parseInt(newServiceId) },
      select: { name: true },
    }) : null;

    let redirectMsg = `Redirigé vers ${tech ? `${tech.name} ${tech.surname}` : "N/A"}`;
    if (svc) redirectMsg += ` / service ${svc.name}`;
    if (newCategory) redirectMsg += ` / catégorie ${newCategory}`;
    if (note) redirectMsg += `\nRaison : ${note}`;

    await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(assignedById),
        comment: redirectMsg,
        comment_type: "redirect",
        created_at: new Date(),
      },
    });

    // ── Notifier le nouveau technicien ──
    if (newTechId) {
      await notifyTechAssigned(parseInt(newTechId), id, current.title);
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
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
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
      sla_date_limite: t.sla_date_limite,
      sla_date_debut:  t.sla_date_debut,
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
};