const prisma = require("../prismaClient");

const getMyTickets = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const tickets = await prisma.ticket.findMany({
      where: { created_by: userId },
      include: {
        user_ticket_assigned_toTouser: {
          select: { name: true, surname: true },
        },
        service: {
          select: { name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const mapped = tickets.map((t) => ({
      id:       t.id,
      title:    t.title,
      service:  t.service?.name || "N/A",
      technicien: t.user_ticket_assigned_toTouser
        ? `${t.user_ticket_assigned_toTouser.name || ""} ${t.user_ticket_assigned_toTouser.surname || ""}`.trim()
        : "Non assigné",
      status:   t.status,
      priority: t.priority,

      // ── Dates needed for archive logic ───────────────────────────────
      // closed_at: set by the backend when status becomes "closed" or "rejected"
      closed_at:  t.closed_at  ? t.closed_at.toISOString()  : null,
      created_at: t.created_at ? t.created_at.toISOString() : null,
      // ─────────────────────────────────────────────────────────────────

      sla_date_limite: t.sla_date_limite,
      sla_date_debut:  t.sla_date_debut,
      dateCreation: t.created_at
        ? t.created_at.toISOString().split("T")[0]
        : "N/A",
      updated_at: t.updated_at
  ? t.updated_at.toISOString()
  : null,
      urgency:  t.urgency,
      impact:   t.impact,
      category: t.category,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Erreur getMyTickets:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des tickets" });
  }
};

module.exports = { getMyTickets };