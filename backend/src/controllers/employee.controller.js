const prisma = require("../prismaClient");

const employeeConfirmReply = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { employeeId, confirmed } = req.body;

    if (confirmed === undefined) {
      return res.status(400).json({ error: "confirmed requis" });
    }

    const isConfirmed = confirmed === true || confirmed === "true";

    const lastConfirm = await prisma.ticket_comments.findFirst({
      where: { ticket_id: id, comment_type: "confirm" },
      orderBy: { created_at: "desc" },
    });

    if (!lastConfirm) {
      return res.status(400).json({ error: "Aucune demande de confirmation" });
    }

    const alreadyReplied = await prisma.ticket_comments.findFirst({
      where: {
        ticket_id: id,
        comment_type: { in: ["confirmed", "rejected_confirm"] },
        created_at: { gt: lastConfirm.created_at },
      },
    });

    if (alreadyReplied) {
      return res.status(400).json({ error: "Deja repondu" });
    }

    await prisma.$executeRaw`
  UPDATE tickets 
  SET 
    is_resolved_confirmed = ${isConfirmed},
    confirmation_requested = false,
    status = ${isConfirmed ? "resolved" : "in_progress"}::ticket_status_enum,
    updated_at = NOW()
  WHERE id = ${id}
`;

    await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(employeeId),
        comment: isConfirmed ? "Confirme resolu." : "Probleme persiste.",
        comment_type: isConfirmed ? "confirmed" : "rejected_confirm",
        created_at: new Date(),
      },
    });

    res.json({ success: true, confirmed: isConfirmed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const employeeReply = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { employeeId, message } = req.body;
    const files = req.files ?? [];

    if ((!message || !message.trim()) && files.length === 0) {
      return res.status(400).json({ error: "Message ou fichier requis" });
    }

    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: id,
        user_id: parseInt(employeeId),
        comment: message || "",
        comment_type: "emp_reply",
        created_at: new Date(),
      },
    });

    if (files.length > 0) {
      await prisma.ticket_attachments.createMany({
        data: files.map((f) => ({
          ticket_id: id,
          comment_id: comment.id,
          file_name: f.originalname,
          file_path: f.path,
          uploaded_by: parseInt(employeeId),
          uploaded_at: new Date(),
        })),
      });
    }

    await prisma.tickets.update({
      where: { id },
      data: { updated_at: new Date() },
    });

    res.json({ success: true, commentId: comment.id, filesUploaded: files.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur envoi" });
  }
};

module.exports = { employeeConfirmReply, employeeReply };