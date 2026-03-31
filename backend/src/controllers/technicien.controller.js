const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── GET ticket détail pour technicien ──
const getTicketDetailTech = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_created_byTousers: {
          select: { name: true, surname: true, email: true, department: true, role: true },
        },
        users_tickets_assigned_toTousers: {
          select: { id: true, name: true, surname: true },
        },
        services: { select: { name: true } },
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
      employee: ticket.users_tickets_created_byTousers,
      technician: ticket.users_tickets_assigned_toTousers,
      service: ticket.services?.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET tous les techniciens (pour redirection) ──
const getAllTechniciens = async (req, res) => {
  try {
    const techs = await prisma.users.findMany({
      where: { role: "technician" },
      select: { id: true, name: true, surname: true },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── PUT rediriger ticket vers autre technicien ──
const redirectTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { newTechId } = req.body;

    const ticket = await prisma.tickets.update({
      where: { id },
      data: { assigned_to: parseInt(newTechId), updated_at: new Date() },
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la redirection" });
  }
};

module.exports = { getTicketDetailTech, getAllTechniciens, redirectTicket };