const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getManagerStats = async (req, res) => {
  try {
    const managerId = parseInt(req.params.managerId);

    // Parse filter params: year, month (1-12)
    const filterYear = req.query.year ? parseInt(req.query.year) : null;
    const filterMonth = req.query.month ? parseInt(req.query.month) : null; // 1=Jan, 12=Dec

    // Build date range for filtering
    let dateFilter = {};
    if (filterYear && filterMonth) {
      // Filter by specific month of a year
      const startDate = new Date(filterYear, filterMonth - 1, 1);
      const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59); // last day of month
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
    } else if (filterYear) {
      // Filter by full year
      const startDate = new Date(filterYear, 0, 1);
      const endDate = new Date(filterYear, 11, 31, 23, 59, 59);
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
    }

    // 1. Get Manager's Service Info
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        service_id: true,
        service: { select: { name: true } }
      }
    });

    if (!manager || !manager.service_id) {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    const sId = manager.service_id;
    const serviceName = manager.service.name;

    // 2. Fetch all Enum Labels from DB
    const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
    ]);

    const allStatuses = dbStatuses.map(r => r.enumlabel);
    const allPriorities = dbPriorities.map(r => r.enumlabel);
    const allCategories = dbCategories.map(r => r.enumlabel);

    // 3. Performance per Technician (filtered by date)
const techPerformanceRaw = await prisma.user.findMany({
  where: { service_id: sId, role: 'technician' },
  select: {
    name: true,
    surname: true,
    ticket_ticket_assigned_toTouser: {
      where: {
        service_id: sId,          // ✅ ajouter filtre service
        ...dateFilter              // ✅ ajouter filtre date
      },
      select: { status: true },
    }
  }
});

    const techPerformance = techPerformanceRaw.map(t => {
      const tickets = t.ticket_ticket_assigned_toTouser;
      const totalAssigned = tickets.length;
      const resolved = tickets.filter(tk => tk.status === 'resolved').length;
      const rejected = tickets.filter(tk => tk.status === 'rejected').length;
      const closed = tickets.filter(tk => tk.status === 'closed').length;
      // Taux de résolution: resolved / total assigned (not including closed in numerator per requirement)
      const resolutionRate = totalAssigned > 0 ? (resolved / totalAssigned) * 100 : 0;
      return {
        name: `${t.name} ${t.surname}`,
        totalAssigned,
        resolu: resolved,
        ferme: closed,
        rejete: rejected,
        resolutionRate: Math.round(resolutionRate)
      };
    });

    // 4. Tickets by Status (filtered)
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      where: { service_id: sId, ...dateFilter },
      _count: { id: true }
    });

    const statusStats = allStatuses.map(label => {
      const found = statusCounts.find(s => s.status === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 5. Tickets by Priority (filtered)
    const priorityCounts = await prisma.ticket.groupBy({
      by: ['priority'],
      where: { service_id: sId, ...dateFilter },
      _count: { id: true }
    });

    const priorityStats = allPriorities.map(label => {
      const found = priorityCounts.find(p => p.priority === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 6. Tickets by Category (filtered)
    const categoryCounts = await prisma.ticket.groupBy({
      by: ['category'],
      where: { service_id: sId, ...dateFilter },
      _count: { id: true }
    });

    const categoryStats = allCategories.map(label => {
      const found = categoryCounts.find(c => c.category === label);
      return { name: label, value: found ? found._count.id : 0 };
    });

    // 7. SLA & Global Counts (filtered)
    const totalTickets = await prisma.ticket.count({
      where: { service_id: sId, ...dateFilter }
    });

    const resolvedCount = await prisma.ticket.count({
      where: { service_id: sId, status: 'resolved', ...dateFilter }
    });
const now = new Date();

const dateFrom = filterYear
  ? new Date(filterYear, filterMonth ? filterMonth - 1 : 0, 1)
  : new Date('2000-01-01');

const dateTo = filterYear
  ? new Date(filterYear, filterMonth ? filterMonth : 12, 0, 23, 59, 59)
  : new Date('2099-12-31');

const overdueCount = await prisma.ticket.count({
  where: {
    service_id: sId,
    sla_date_limite: { lt: now },
    status: { notIn: ['resolved', 'closed', 'rejected'] },
    ...dateFilter
  }
});

// ✅ slaIn = tout le reste
const slaIn = totalTickets - overdueCount;
          
    // 9. Tickets by Type (filtered)
    const typeStatsRaw = await prisma.ticket.groupBy({
      by: ['type'],
      where: { service_id: sId, ...dateFilter },
      _count: { id: true }
    });
    const typeStats = typeStatsRaw.map(t => ({
      name: t.type || 'Inconnu',
      value: t._count.id,
      percentage: totalTickets > 0 ? Math.round((t._count.id / totalTickets) * 100) : 0
    }));

    // 10. Monthly Stats — only show if filtering by year (or no filter = current year)
    const currentYear = filterYear || new Date().getFullYear();
    let monthlyStats = [];

    if (!filterMonth) {
      // Show full year breakdown only when not filtering by a specific month
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const monthlyRaw = await prisma.ticket.findMany({
        where: {
          service_id: sId,
          created_at: { gte: startOfYear, lte: endOfYear }
        },
        select: { created_at: true }
      });

      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      const monthlyGroups = {};
      months.forEach(m => { monthlyGroups[m] = 0; });
      monthlyRaw.forEach(t => {
        const monthIndex = new Date(t.created_at).getMonth();
        monthlyGroups[months[monthIndex]]++;
      });
      monthlyStats = months.map(monthName => ({
        month: monthName,
        value: monthlyGroups[monthName]
      }));
    } else {
      // When filtering by specific month: show daily breakdown
      const daysInMonth = new Date(currentYear, filterMonth, 0).getDate();
      const dailyRaw = await prisma.ticket.findMany({
        where: {
          service_id: sId,
          created_at: {
            gte: new Date(currentYear, filterMonth - 1, 1),
            lte: new Date(currentYear, filterMonth - 1, daysInMonth, 23, 59, 59)
          }
        },
        select: { created_at: true }
      });

      const dailyGroups = {};
      for (let d = 1; d <= daysInMonth; d++) {
        dailyGroups[d] = 0;
      }
      dailyRaw.forEach(t => {
        const day = new Date(t.created_at).getDate();
        dailyGroups[day]++;
      });
      monthlyStats = Object.entries(dailyGroups).map(([day, value]) => ({
        month: `J${day}`,
        value
      }));
    }

    // 11. Fetch available years from DB for the filter dropdown
    const yearsRaw = await prisma.$queryRaw`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
      FROM ticket
      WHERE service_id = ${sId}
      ORDER BY year DESC
    `;
    const availableYears = yearsRaw.map(r => r.year);

    // Service-level resolution rate
    const serviceResolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

    res.json({
      serviceName,
      totalTickets,
      resolvedCount,
      resolutionRate: serviceResolutionRate,

      slaStats: [
        { name: 'Respecté', value: slaIn },
        { name: 'Dépassé', value: overdueCount }
      ],
      techPerformance,
      statusStats,
      priorityStats,
      categoryStats,
      typeStats,
      monthlyStats,
      availableYears,
      filterApplied: { year: filterYear, month: filterMonth }
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
};

// Active tickets count for a technician
const getActiveTechnicianTicketsCount = async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);
    const count = await prisma.ticket.count({
      where: {
        assigned_to: techId,
        status: { notIn: ["closed", "resolved", "rejected"] }
      }
    });
    res.json({ count });
  } catch (err) {
    console.error("Active tickets count error:", err);
    res.status(500).json({ error: "Erreur lors du comptage des tickets actifs" });
  }
};

module.exports = { getManagerStats, getActiveTechnicianTicketsCount };