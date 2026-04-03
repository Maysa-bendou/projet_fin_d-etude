const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getMyTickets } = require("../controllers/ticket.controller");
const { getTicketDetailTech } = require("../controllers/technicien.controller");
const { employeeConfirmReply, employeeReply } = require("../controllers/employee.controller");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Multer for employee file uploads ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../../uploads/tickets/${req.params.id}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ── Employee-facing endpoints ──────────────────────────────────────────────

// PUT /api/tickets/:id/confirm-reply
// Employee answers the confirmation card: { employeeId, confirmed: true/false }
router.put("/:id/confirm-reply", employeeConfirmReply);

// POST /api/tickets/:id/employee-reply
// Employee replies to a technician info request (with optional files)
router.post("/:id/employee-reply", upload.array("files", 10), employeeReply);

// ── Existing routes (unchanged) ───────────────────────────────────────────

router.post("/create", async (req, res) => {
  try {
    const { title, description, category, impact, urgency, type, created_by } = req.body;
    if (!title || !description || !category || !impact || !urgency || !type || !created_by) {
      return res.status(400).json({ error: "Champs manquants" });
    }
    const PRIORITY_MATRIX = {
      high:   { high: "critical", medium: "high",   low: "medium" },
      medium: { high: "high",     medium: "medium",  low: "low"   },
      low:    { high: "medium",   medium: "low",     low: "low"   },
    };
    const priority = PRIORITY_MATRIX[impact][urgency];
    const SLA_DAYS = { critical: 3, high: 3, medium: 7, low: 14 };
    const sla_due_date = new Date();
    sla_due_date.setDate(sla_due_date.getDate() + SLA_DAYS[priority]);
    const ticket = await prisma.tickets.create({
      data: { title, description, category, impact, urgency, type, priority, created_by, sla_due_date },
    });
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
      sla: t.sla_due_date,
      date_expiration: t.sla_due_date,
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
        // ── Include comments so the employee page can read them ──
        ticket_comments: {
          orderBy: { created_at: "asc" },
          include: {
            users: { select: { id: true, name: true, surname: true, role: true } },
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
      sla_due_date: ticket.sla_due_date,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      solution: ticket.solution,
      closing_note: ticket.closing_note,
      is_resolved_confirmed: ticket.is_resolved_confirmed,
      confirmation_requested: ticket.confirmation_requested,
      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name,
      // ── Comments for employee to consume ──
      comments: ticket.ticket_comments.map((c) => ({
        id: c.id,
        message: c.comment,
        comment_type: c.comment_type ?? "comment",
        author: `${c.users?.name ?? ""} ${c.users?.surname ?? ""}`.trim(),
        authorRole: c.users?.role ?? "",
        authorId: c.users?.id,
        date: c.created_at,
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

router.put("/:id/assign", async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { assigned_to, technicienId, action, assigned_by } = req.body;
  const techId = assigned_to || technicienId;
  if (!techId) return res.status(400).json({ error: "Technician ID is required" });
  try {
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


