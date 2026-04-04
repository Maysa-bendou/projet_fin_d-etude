const prisma = require("../prismaClient");

// Get tickets created by a specific user
const getMyTickets = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const tickets = await prisma.tickets.findMany({
      where: { created_by: userId },
      include: {
        users_tickets_assigned_toTousers: {
          select: { name: true, surname: true }
        },
        services: {
          select: { name: true }
        }
      },
      orderBy: { created_at: "desc" },   // déjà bon
    });

    const mapped = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      service: t.services?.name || "N/A",
      technicien: t.users_tickets_assigned_toTousers 
        ? `${t.users_tickets_assigned_toTousers.name || ''} ${t.users_tickets_assigned_toTousers.surname || ''}`.trim() 
        : "Non assigné",
      status: t.status,
      priority: t.priority,
      dateCreation: t.created_at ? t.created_at.toISOString().split("T")[0] : "N/A",
      maj: t.updated_at 
        ? t.updated_at.toISOString().split("T")[0] + " " + t.updated_at.toISOString().split("T")[1].slice(0, 5)
        : "N/A",
      urgency: t.urgency,
      impact: t.impact,
      category: t.category,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Erreur getMyTickets:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des tickets" });
  }
};

module.exports = {
  getMyTickets,
};