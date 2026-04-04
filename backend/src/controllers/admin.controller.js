const prisma = require("../config/prisma");

// GET STATS
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.users.count();
    const totalTickets = await prisma.tickets.count();

    res.json({ totalUsers, totalTickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};