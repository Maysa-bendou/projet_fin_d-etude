const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getMyTickets } = require("../controllers/ticket.controller");
const { getTicketDetailTech } = require("../controllers/technicien.controller");
const { employeeConfirmReply, employeeReply } = require("../controllers/employee.controller");
const {
  notifyAllManagersOfService,
  notifyAllTechsOfService,
  notifyTechAssigned,
  notifyEmployeeAssigned,
} = require("../controllers/notification.service");



// ── Multer ────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../../uploads/tickets/${req.params.id}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ── Employee endpoints ────────────────────────────────────────────────────
router.put("/:id/confirm-reply", employeeConfirmReply);
router.post("/:id/employee-reply", upload.array("files", 10), employeeReply);

// ── Création ticket ───────────────────────────────────────────────────────
// ── Mapping catégorie → service_id ─────────────────────────────────────
const CATEGORY_SERVICE_MAP = {
  hardware:  1, // IT Support
  software:  1, // IT Support
  account:   1, // IT Support
  network:   2, // IT Network
  security:  3, // IT Security
  access:    4, // IT Collaboration Systems
};

router.post("/create", async (req, res) => {
  try {
    const { title, description, category, impact, urgency, type, created_by } = req.body;
    if (!title || !description || !category || !impact || !urgency || !type || !created_by)
      return res.status(400).json({ error: "Champs manquants" });

    const PRIORITY_MATRIX = {
      high:   { high: "critical", medium: "high",   low: "medium" },
      medium: { high: "high",     medium: "medium", low: "low"    },
      low:    { high: "medium",   medium: "low",    low: "low"    },
    };
 const priority = PRIORITY_MATRIX[impact]?.[urgency];
console.log("👉 priority calculé:", priority);

const slaConfig = await prisma.sla_config.findFirst({ where: { priority } });
console.log("👉 slaConfig trouvé:", slaConfig);
    const service_id = CATEGORY_SERVICE_MAP[category] ?? null;
    const sla_date_debut  = new Date();
    const sla_date_limite = new Date(sla_date_debut.getTime() + slaConfig.duration_hours * 3600000);

    // ✅ 1. Créer le ticket
    const created = await prisma.tickets.create({
      data: {
        title, description, category, impact, urgency, type, priority,
        created_by: parseInt(created_by),
        service_id,
        sla_date_debut,
        sla_date_limite,
        sla_statut: "en_cours",
      },
    });console.log("👉 created complet:", JSON.stringify(created));

    // ✅ 2. Relire depuis la base (fix bug Prisma 5 + Timestamptz)
    const ticket = await prisma.tickets.findUnique({
      where: { id: created.id },
    });
    console.log("👉 ticket après relecture:", ticket.sla_date_limite);

    // ✅ 3. Notifications
    if (service_id) {
      await Promise.all([
        notifyAllTechsOfService(service_id, ticket.id, ticket.title),
        notifyAllManagersOfService(service_id, ticket.id, ticket.title),
      ]);
    }

    res.json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création du ticket" });
  }
});

router.get("/my/:userId", getMyTickets);

router.get("/assigned/:techId", async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);
    const tickets = await prisma.tickets.findMany({
      where: { assigned_to: techId },
      include: {
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
        services: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du fetch" });
  }
});

router.get("/", async (req, res) => {
  try {
    const tickets = await prisma.tickets.findMany({
      include: {
        users_tickets_created_byTousers: true,
        users_tickets_assigned_toTousers: true,
        services: true,
      },
      orderBy: { created_at: "desc" },
    });
    const formatted = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      impact: t.impact,
      urgency: t.urgency,
      serviceId: t.service_id,
      sla:             t.sla_date_limite,
      date_expiration: t.sla_date_limite,
      sla_date_limite: t.sla_date_limite,
      sla_date_debut:  t.sla_date_debut,
      createdBy: t.users_tickets_created_byTousers?.name,
      employee: t.users_tickets_created_byTousers,
      assignedTo: t.users_tickets_assigned_toTousers?.name,
      technicienId: t.assigned_to,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const ticket = await prisma.tickets.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.get("/techniciens", async (req, res) => {
  try {
    const techs = await prisma.users.findMany({
      where: { role: "technician" },
      select: { id: true, name: true, surname: true },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_created_byTousers: {
          select: {
            name: true, surname: true, email: true,
            department: true, role: true, phone: true,
            office: true, job_title: true,
          },
        },
        users_tickets_assigned_toTousers: {
          select: { name: true, surname: true, id: true },
        },
        services: { select: { name: true } },
        ticket_comments: {
          orderBy: { created_at: "asc" },
          include: {
            users: { select: { id: true, name: true, surname: true, role: true } },
            ticket_attachments: true,
          },
        },
      },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      impact: ticket.impact,
      urgency: ticket.urgency,
      type: ticket.type,
      sla_date_limite: ticket.sla_date_limite,
      sla_date_debut:  ticket.sla_date_debut,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      solution: ticket.solution,
      closing_note: ticket.closing_note,
      is_resolved_confirmed: ticket.is_resolved_confirmed,
      confirmation_requested: ticket.confirmation_requested,
      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name,
      comments: ticket.ticket_comments.map((c) => ({
        id: c.id,
        message: c.comment,
        comment_type: c.comment_type ?? "comment",
        author: `${c.users?.name ?? ""} ${c.users?.surname ?? ""}`.trim(),
        authorRole: c.users?.role ?? "",
        authorId: c.users?.id,
        date: c.created_at,
        files: (c.ticket_attachments ?? []).map(a => ({
          fileName: a.file_name,
          filePath: a.file_path
            ? a.file_path.replace(/^.*[\\\/]uploads[\\\/]/, "uploads/").replace(/\\/g, "/")
            : null,
        })),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, impact, urgency, status } = req.body;
    if (!title || !description || !impact || !urgency) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const PRIORITY_MATRIX = {
      high:   { high: "critical", medium: "high",   low: "medium" },
      medium: { high: "high",     medium: "medium", low: "low"   },
      low:    { high: "medium",   medium: "low",    low: "low"   },
    };
    const priority = PRIORITY_MATRIX[impact][urgency];
    const updatedTicket = await prisma.tickets.update({
      where: { id },
      data: {
        title, description, impact, urgency, priority,
        status: status || undefined,
        updated_at: new Date(),
      },
    });
    res.json({
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      impact: updatedTicket.impact,
      urgency: updatedTicket.urgency,
      priority: updatedTicket.priority,
      status: updatedTicket.status,
      updatedAt: updatedTicket.updated_at,
    });
  } catch (err) {
    console.error("Détail de l'erreur :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// ── Assignation ───────────────────────────────────────────────────────────
router.put("/:id/assign", async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { assigned_to, technicienId, action, assigned_by } = req.body;
  const techId = assigned_to || technicienId;
  if (!techId) return res.status(400).json({ error: "Technician ID is required" });
  try {
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { title: true, created_by: true },
    });

    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        assigned_to: techId,
        status: action === "taken" ? "in_progress" : "open",
      },
    });

    await prisma.ticket_assignments_history.create({
      data: {
        ticket_id: ticketId,
        from_user_id: action === "assigned" ? assigned_by : null,
        to_user_id: techId,
        action: action || "taken",
        reason: action === "taken" ? "Technician took charge" : "Manager assigned",
      },
    });

    // ── Notifier le technicien assigné ──
    await notifyTechAssigned(techId, ticketId, ticket.title);

    // ── Notifier l'employé que son ticket a été assigné ──
    if (ticket.created_by) {
      const tech = await prisma.users.findUnique({
        where: { id: techId },
        select: { name: true, surname: true },
      });
      const techName = tech ? `${tech.name} ${tech.surname}`.trim() : "un technicien";
      await notifyEmployeeAssigned(ticket.created_by, ticketId, ticket.title, techName);
    }

    res.json({
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      status: updatedTicket.status,
      assigned_to: updatedTicket.assigned_to,
      createdAt: updatedTicket.created_at.toISOString(),
      updatedAt: updatedTicket.updated_at.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible d'assigner le ticket" });
  }
});

module.exports = router;