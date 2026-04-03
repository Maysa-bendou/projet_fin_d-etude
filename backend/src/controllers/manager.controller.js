const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getManagerStats = async (req, res) => {
  try {
    const managerId = parseInt(req.params.managerId);

    // 1. Get Manager's Service Info
    const manager = await prisma.users.findUnique({
      where: { id: managerId },
      select: { 
        service_id: true,
        services: { select: { name: true } } 
      }
    });

    if (!manager || !manager.service_id) {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    const sId = manager.service_id;
    const serviceName = manager.services.name;

    // 2. Fetch all Enum Labels from DB to ensure charts show all possible states
    const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
    ]);

    const allStatuses = dbStatuses.map(r => r.enumlabel);
    const allPriorities = dbPriorities.map(r => r.enumlabel);
    const allCategories = dbCategories.map(r => r.enumlabel);

    // 3. Performance per Technician
    const techPerformanceRaw = await prisma.users.findMany({
      where: { service_id: sId, role: 'technician' },
      select: {
        name: true,
        surname: true,
        tickets_tickets_assigned_toTousers: {
          select: { status: true },
        }
      }
    });

    const techPerformance = techPerformanceRaw.map(t => {
      const tickets = t.tickets_tickets_assigned_toTousers;
      const totalAssigned = tickets.length;
      const resolved = tickets.filter(tk => tk.status === 'resolved' || tk.status === 'closed').length;
      const rejected = tickets.filter(tk => tk.status === 'rejected').length;
      const resolutionRate = totalAssigned > 0 ? (resolved / totalAssigned) * 100 : 0;
      return {
        name: `${t.name} ${t.surname}`,
        totalAssigned,
        resolu: resolved,
        rejete: rejected,
        resolutionRate: Math.round(resolutionRate)
      };
    });

    // 4. Tickets by Status (Full DB Range)
    const statusCounts = await prisma.tickets.groupBy({
      by: ['status'],
      where: { service_id: sId },
      _count: { id: true }
    });

    const statusStats = allStatuses.map(label => {
      const found = statusCounts.find(s => s.status === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 5. Tickets by Priority (Full DB Range)
    const priorityCounts = await prisma.tickets.groupBy({
      by: ['priority'],
      where: { service_id: sId },
      _count: { id: true }
    });

    const priorityStats = allPriorities.map(label => {
      const found = priorityCounts.find(p => p.priority === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 6. Tickets by Category (Full DB Range)
    const categoryCounts = await prisma.tickets.groupBy({
      by: ['category'],
      where: { service_id: sId },
      _count: { id: true }
    });

    const categoryStats = allCategories.map(label => {
      const found = categoryCounts.find(c => c.category === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 7. SLA & Global Counts
    const totalTickets = await prisma.tickets.count({ where: { service_id: sId } });
    const resolvedCount = await prisma.tickets.count({ 
        where: { service_id: sId, status: { in: ['resolved', 'closed'] } } 
    });

    const now = new Date();
    const overdueCount = await prisma.tickets.count({
      where: { 
        service_id: sId, 
        sla_due_date: { lt: now }, 
        status: { notIn: ['resolved', 'closed'] } 
      }
    });

    const slaIn = totalTickets - overdueCount;

    // 8. Tickets by Type (Incident vs Request)
    const typeStatsRaw = await prisma.tickets.groupBy({
      by: ['type'],
      where: { service_id: sId },
      _count: { id: true }
    });
    const typeStats = typeStatsRaw.map(t => ({
      name: t.type || 'Inconnu',
      value: t._count.id,
      percentage: totalTickets > 0 ? Math.round((t._count.id / totalTickets) * 100) : 0
    }));

    // 9. Monthly Stats (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRaw = await prisma.tickets.findMany({
      where: { service_id: sId, created_at: { gte: sixMonthsAgo } },
      select: { created_at: true }
    });

    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const monthlyGroups = {};
    monthlyRaw.forEach(t => {
      const m = months[new Date(t.created_at).getMonth()];
      monthlyGroups[m] = (monthlyGroups[m] || 0) + 1;
    });

    const monthlyStats = Object.keys(monthlyGroups).map(k => ({ month: k, value: monthlyGroups[k] }));

    // Response
    res.json({
      serviceName,
      totalTickets,
      resolutionRate: totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0,
      slaStats: [
        { name: 'Respecté', value: slaIn },
        { name: 'Dépassé', value: overdueCount }
      ],
      techPerformance,
      statusStats,   // Contains all DB statuses
      priorityStats, // Contains all DB priorities
      categoryStats, // Contains all DB categories
      typeStats,
      monthlyStats
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
};

module.exports = { getManagerStats };