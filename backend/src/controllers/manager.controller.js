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

    // 9. Monthly Stats (Full Year for the current year)
    const currentYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyRaw = await prisma.tickets.findMany({
      where: { 
        service_id: sId, 
        created_at: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: { created_at: true }
    });

    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const monthlyGroups = {};
    months.forEach(m => { monthlyGroups[m] = 0; });

    monthlyRaw.forEach(t => {
      const monthIndex = new Date(t.created_at).getMonth();
      const monthName = months[monthIndex];
      monthlyGroups[monthName]++;
    });

    const monthlyStats = months.map(monthName => ({
      month: monthName,
      value: monthlyGroups[monthName]
    }));

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
      statusStats,
      priorityStats,
      categoryStats,
      typeStats,
      monthlyStats
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
};

// ✅ Nombre de tickets actifs d'un technicien (statut != closed / resolved / rejected)
const getActiveTechnicianTicketsCount = async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);
    console.log("🔍 techId:", techId); // ← add this

    const count = await prisma.tickets.count({
      where: {
        assigned_to: techId,
        status: { notIn: ["closed", "resolved", "rejected"] }
      }
    });

    console.log("✅ count for", techId, ":", count); // ← and this
    res.json({ count });
  } catch (err) {
    console.error("Active tickets count error:", err);
    res.status(500).json({ error: "Erreur lors du comptage des tickets actifs" });
  }
};

module.exports = { getManagerStats, getActiveTechnicianTicketsCount };