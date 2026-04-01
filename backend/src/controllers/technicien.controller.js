const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
            users: { select: { id: true, name: true, surname: true, role: true } },
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

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

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
      sla_due_date: ticket.sla_due_date,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      solution: ticket.solution,
      is_resolved_confirmed: ticket.is_resolved_confirmed,
      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name ?? null,
      serviceId: ticket.services?.id ?? null,
      assignedBy,
      comments: ticket.ticket_comments.map((c) => ({
        id: c.id,
        message: c.comment,
        author: `${c.users?.name ?? ""} ${c.users?.surname ?? ""}`.trim(),
        authorRole: c.users?.role ?? "",
        authorId: c.users?.id,
        date: c.created_at,
      })),
      attachments: ticket.ticket_attachments.map((a) => ({
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
    const { status } = req.body;
    const valid = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Statut invalide" });
    const updated = await prisma.tickets.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
    res.json({ success: true, status: updated.status });
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

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(technicianId),
        comment: message,
        created_at: new Date(),
      },
    });

    if (type === "solution") {
      await prisma.tickets.update({
        where: { id },
        data: { solution: message, status: "resolved", updated_at: new Date() },
      });
    }
    if (type === "info") {
      await prisma.tickets.update({
        where: { id },
        data: { status: "pending", updated_at: new Date() },
      });
    }

    const files = req.files ?? [];
    if (files.length > 0) {
      await prisma.ticket_attachments.createMany({
        data: files.map((f) => ({
          ticket_id: id,
          file_name: f.originalname,
          file_path: f.path,
          uploaded_by: parseInt(technicianId),
          uploaded_at: new Date(),
        })),
      });
    }

    res.json({ success: true, commentId: comment.id, filesUploaded: files.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
};

// ── PUT confirmer résolution ───────────────────────────────────────────────
const confirmResolution = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.tickets.update({
      where: { id },
      data: { is_resolved_confirmed: true, status: "closed", updated_at: new Date() },
    });
    res.json({ success: true });
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
      select: { assigned_to: true, service_id: true },
    });

    await prisma.tickets.update({
      where: { id },
      data: {
        ...(newTechId    && { assigned_to: parseInt(newTechId) }),
        ...(newServiceId && { service_id: parseInt(newServiceId) }),
        ...(newCategory  && { category: newCategory }),
        status: "open",
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

    if (note && assignedById) {
      await prisma.ticket_comments.create({
        data: {
          ticket_id:  id,
          user_id:    parseInt(assignedById),
          comment:    `[REDIRECTION] ${note}`,
          created_at: new Date(),
        },
      });
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
      where: {
        assigned_to: techId,
        status: { notIn: ["closed"] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        category: true,
        status: true,
        created_at: true,
        sla_due_date: true,
        users_tickets_created_byTousers: {
          select: { name: true, surname: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = tickets.map(t => ({
      id:            t.id,
      title:         t.title,
      description:   t.description,
      priority:      t.priority,
      category:      t.category,
      status:        t.status,
      created_at:    t.created_at,
      sla_due_date:  t.sla_due_date,
      employee_name: `${t.users_tickets_created_byTousers?.name ?? ""} ${t.users_tickets_created_byTousers?.surname ?? ""}`.trim(),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET enums depuis PostgreSQL ────────────────────────────────────────────
const getEnums = async (req, res) => {
  try {
    const statuts = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'ticket_status_enum'
      ORDER BY enumsortorder;
    `;
    const priorites = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'priority_enum'
      ORDER BY enumsortorder;
    `;
    const categories = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'category_enum'
      ORDER BY enumsortorder;
    `;

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

// ── Exports ────────────────────────────────────────────────────────────────
module.exports = {
  getTicketDetailTech,
  updateTicketStatus,
  sendSolution,
  confirmResolution,
  redirectTicket,
  getServices,
  getAllTechniciens,
  getAssignedTickets,
  getEnums,
};