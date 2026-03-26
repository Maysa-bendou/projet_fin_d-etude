const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Get all tickets ──
const getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// ── Get ticket by ID ──
const getTicketById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// ── Update ticket status ──
const updateTicketStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });
    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

// ── Send solution or info ──
const sendMessage = async (req, res) => {
  const id = parseInt(req.params.id);
  const { message } = req.body;
  const type = req.params.type; // 'solution' or 'info'

  try {
    // Example: store in a TicketMessages table
    const newMsg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        type,
        message,
        createdAt: new Date(),
      },
    });
    res.json(newMsg);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  sendMessage,
};