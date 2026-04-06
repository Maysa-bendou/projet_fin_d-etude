const prisma = require("../prismaClient");

// ── Get all tickets ──
const getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: true } // Added to see who created the ticket
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
      include: { 
        employee: true,
        technician: true // Added to see if anyone is assigned
      }
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// Obtenir les techniciens par service
const getTechniciansByService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);

    const technicians = await prisma.users.findMany({
      where: {
        service_id: serviceId,
        role: "technician",   // 🔴 VERY IMPORTANT
        is_active: true       // optional but recommended
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        job_title: true,
        office: true,
      },
    });

    res.json(technicians);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Assigner le ticket
const assignTicket = async (req, res) => {
  const { id } = req.params;
  const { technicienId } = req.body;

  try {
    const updatedTicket = await prisma.tickets.update({
      where: { id: parseInt(id) },
      data: {
        assigned_to: parseInt(technicienId),
        status: "in_progress", // Passage automatique en cours
      }
    });
    res.json(updatedTicket);
  } catch (error) {
    console.error("Assign Error:", error);
    res.status(500).json({ error: "Échec de l'assignation" });
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
  const type = req.params.type; 

  try {
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
  getTechniciansByService, // Export new function
  assignTicket,            // Export new function
  updateTicketStatus,
  sendMessage,
};