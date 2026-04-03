const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * PUT /api/tickets/:id/confirm-reply
 * Body: { employeeId, confirmed: true | false }
 * Called when employee clicks "Oui, résolu" or "Non, toujours un problème"
 */
const employeeConfirmReply = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { employeeId, confirmed } = req.body;

    if (confirmed === undefined) {
      return res.status(400).json({ error: "confirmed (boolean) est requis" });
    }

    // Update ticket fields
    await prisma.tickets.update({
      where: { id },
      data: {
        is_resolved_confirmed: confirmed ? true : false,
        // If employee says yes → resolve; if no → re-open so tech can send new solution
        status: confirmed ? "resolved" : "in_progress",
        // Reset confirmation_requested so tech can send another solution if needed
        confirmation_requested: confirmed ? true : false,
        updated_at: new Date(),
      },
    });

    // Log in comments
    await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(employeeId),
        comment: confirmed
          ? "L'employé a confirmé que le problème est résolu."
          : "L'employé a signalé que le problème persiste.",
        comment_type: confirmed ? "confirmed" : "rejected_confirm",
        created_at: new Date(),
      },
    });

    res.json({ success: true, confirmed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * POST /api/tickets/:id/employee-reply
 * Body (multipart): { employeeId, message }
 * Files: optional attachments
 * Called when employee replies to a technician info request
 */
const employeeReply = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { employeeId, message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Le message est requis" });
    }

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(employeeId),
        comment: message,
        comment_type: "emp_reply",
        created_at: new Date(),
      },
    });

    // Save attachments if any
    const files = req.files ?? [];
    if (files.length > 0) {
      await prisma.ticket_attachments.createMany({
        data: files.map((f) => ({
          ticket_id: id,
          file_name: f.originalname,
          file_path: f.path,
          uploaded_by: parseInt(employeeId),
          uploaded_at: new Date(),
        })),
      });
    }

    // Update updated_at on ticket
    await prisma.tickets.update({
      where: { id },
      data: { updated_at: new Date() },
    });

    res.json({ success: true, commentId: comment.id, filesUploaded: files.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi de la réponse" });
  }
};

module.exports = { employeeConfirmReply, employeeReply };