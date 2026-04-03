// ── PUT statut — saves a comment so status history is visible on refresh ──
const updateTicketStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, technicianId } = req.body;
    const valid = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Statut invalide" });

    // Fetch the old status first so we can log the transition
    const current = await prisma.tickets.findUnique({ where: { id }, select: { status: true } });
    const oldStatus = current?.status ?? "open";

    const STATUS_FR = {
      open:"Ouvert", in_progress:"En cours", pending:"En attente",
      pending_supplier:"Att. fournisseur", resolved:"Résolu", closed:"Fermé", rejected:"Rejeté",
    };

    // Update the ticket status
    const updated = await prisma.tickets.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });

    // Save a comment so the status change persists and shows in actuality on refresh
    if (technicianId) {
      await prisma.ticket_comments.create({
        data: {
          ticket_id:    id,
          user_id:      parseInt(technicianId),
          comment:      `Statut modifié : <strong>${STATUS_FR[oldStatus] ?? oldStatus}</strong> → <strong>${STATUS_FR[status] ?? status}</strong>`,
          comment_type: "status",
          created_at:   new Date(),
        },
      });
    }

    res.json({ success: true, status: updated.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};