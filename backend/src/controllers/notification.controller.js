const prisma = require("../prismaClient");

// ── GET /api/notifications/:userId ────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const notifs = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── PUT /api/notifications/:id/read ──────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.notifications.update({
      where: { id },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── PUT /api/notifications/read-all/:userId ───────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };