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
    const priorities = ["low", "medium", "high"];  // critical not in priority_enum
const categories = ["hardware", "software", "network", "access", "security", "messagerie"];  // account → messagerie
    const statuses = ["open", "in_progress", "pending", "pending_supplier", "resolved", "closed", "rejected"];
    const impacts = ["low", "medium", "high"];
    const urgencies = ["low", "medium", "high"];
    const roles = ["employee", "technician", "director", "manager", "admin"];
   
    // Dynamic data
const departmentRows = await prisma.users.findMany({
  where: { department: { not: null } },
  select: { department: true },
  distinct: ["department"],
});
const departments = departmentRows.map(r => r.department).filter(Boolean);
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
