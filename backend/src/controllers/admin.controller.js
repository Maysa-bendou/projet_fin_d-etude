const prisma = require("../prismaClient");


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

// GET CONFIG - Dynamic enums, lists, stats
exports.getConfig = async (req, res) => {
  try {
    // Enums from Prisma (hardcoded but match schema - could introspect if needed)
    const priorities = ["low", "medium", "high", "critical"];
    const statuses = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
    const impacts = ["low", "medium", "high"];
    const urgencies = ["low", "medium", "high"];
    const roles = ["employee", "technician", "chef_service", "manager", "admin"];
    const categories = ["hardware", "software", "network", "access", "security", "account"];

    // Dynamic data
    const departments = await prisma.departments.findMany({ select: { id: true, name: true } });
    const services = await prisma.services.findMany({ select: { id: true, name: true } });

    // Role stats
    const roleStats = await prisma.users.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    res.json({
      enums: { priorities, statuses, impacts, urgencies, roles, categories },
      lists: { departments, services },
      roleStats: Object.fromEntries(roleStats.map(r => [r.role, r._count.id]))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
