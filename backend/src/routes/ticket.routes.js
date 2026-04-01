const express = require("express");
const router = express.Router();
const { getMyTickets } = require("../controllers/ticket.controller");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ticket.routes.js

// Création d'un ticket
router.post("/create", async (req, res) => {
  try {
    const { title, description, category, impact, urgency, type, created_by } = req.body;

    // Vérification minimale
    if (!title || !description || !category || !impact || !urgency || !type || !created_by) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Calcul priorité
    const PRIORITY_MATRIX = {
      high:   { high: "critical", medium: "high",   low: "medium" },
      medium: { high: "high",     medium: "medium",  low: "low"    },
      low:    { high: "medium",   medium: "low",     low: "low"    },
    };
    const priority = PRIORITY_MATRIX[impact][urgency];

    // SLA : exemple simple
    const SLA_DAYS = { critical: 3, high: 3, medium: 7, low: 14 };
    const sla_due_date = new Date();
    sla_due_date.setDate(sla_due_date.getDate() + SLA_DAYS[priority]);

    const ticket = await prisma.tickets.create({
      data: {
        title,
        description,
        category,
        impact,
        urgency,
        type,
        priority,
        created_by,
        sla_due_date,
      },
    });

    res.json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création du ticket" });
  }
});


// GET /api/tickets/my/:userId
router.get("/my/:userId", getMyTickets);
router.get("/assigned/:techId", async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);

    const tickets = await prisma.tickets.findMany({
      where: { assigned_to: techId },
      include: {
        users_tickets_created_byTousers: {
          select: { name: true, surname: true },
        },
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
// GET /api/tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await prisma.tickets.findMany({
      include: {
        users_tickets_created_byTousers: true, // Employee info
        users_tickets_assigned_toTousers: true, // Tech info
        services: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Map DB (snake_case) to Frontend (camelCase)
    const formatted = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      impact: t.impact,
      urgency: t.urgency,
      serviceId: t.service_id, // Important for filtering
      sla: t.sla_due_date,
      date_expiration: t.sla_due_date,
      // Employee info
      createdBy: t.users_tickets_created_byTousers?.name,
      employee: t.users_tickets_created_byTousers, // Send full object for detail page
      // Technician info
      assignedTo: t.users_tickets_assigned_toTousers?.name,
      technicienId: t.assigned_to
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
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

////////////////////////////////////////////
//////////////////////////////////////////////
/////////////////////////////////////////////////////
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_created_byTousers: {
          select: {
            name: true,
            surname: true,
            email: true,
            department: true,
            role: true,
          },
        },
        users_tickets_assigned_toTousers: {
          select: { name: true, surname: true },
        },
        services: {
          select: { name: true },
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
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,

      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// PUT /api/tickets/:id/assign
router.put("/:id/assign", async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { assigned_to, technicienId, action, assigned_by } = req.body;

  // Decide which field to use depending on frontend request
  const techId = assigned_to || technicienId;

  if (!techId) return res.status(400).json({ error: "Technician ID is required" });

  try {
    // Update ticket in DB
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        assigned_to: techId,
        status: action === "taken" ? "in_progress" : "open",
      },
    });

    // Optional: insert history record
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

//////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////

module.exports = router;