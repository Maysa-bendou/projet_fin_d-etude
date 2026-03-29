const express = require("express");
const router = express.Router();
const { getMyTickets } = require("../controllers/ticket.controller");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// GET /api/tickets/my/:userId
router.get("/my/:userId", getMyTickets);
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
module.exports = router;