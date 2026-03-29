const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get tickets created by a specific user
const getMyTickets = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const tickets = await prisma.tickets.findMany({
      where: { created_by: userId },
      include: {
        users_tickets_assigned_toTousers: { select: { name: true, surname: true } },
        services: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const mapped = tickets.map((t) => ({
      rawId: t.id,
      titre: t.title,
      service: t.services.length > 0 ? t.services.map(s => s.name).join(", ") : "N/A",
      technicien:
        t.users_tickets_assigned_toTousers.length > 0
          ? t.users_tickets_assigned_toTousers.map(u => `${u.name} ${u.surname}`.trim()).join(", ")
          : "Non assigné",
      status:
        t.status === "open"
          ? "Ouvert"
          : t.status === "in_progress"
          ? "En cours"
          : t.status === "resolved"
          ? "Résolu"
          : t.status === "closed"
          ? "Fermé"
          : t.status === "rejected"
          ? "Rejeté"
          : t.status,
      dateCreation: t.created_at.toISOString().split("T")[0],
      maj: t.updated_at.toISOString().split("T")[0] + " " + t.updated_at.toISOString().split("T")[1].slice(0, 5),
      urgence: t.urgency || "N/A",
      priorite: t.priority,
      impact: t.impact,
      category: t.category,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des tickets" });
  }
};
module.exports = {
  getMyTickets,
};