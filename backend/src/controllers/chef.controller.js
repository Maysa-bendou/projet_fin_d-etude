const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chefController = {
  // 1. STATISTIQUES GLOBALES (Pour la page principale)
  getAllServices: async (req, res) => {
    try {
      const totalTicketsAbsolu = await prisma.tickets.count();

      const allServices = await prisma.services.findMany({
        include: {
          tickets: {
            select: {
              status: true,
              created_at: true,
              updated_at: true,
              solution_date_resolved: true
            }
          }
        }
      });

      const unassignedTickets = await prisma.tickets.findMany({
        where: { service_id: null }
      });

      let servicesWithStats = allServices.map(service => {
        const tickets = service.tickets || [];
        const total = tickets.length;
        
        const resoluCount = tickets.filter(t => t.status === 'resolved').length;
        
        const resolvedWithDates = tickets.filter(t => 
          (t.status === 'resolved' || t.status === 'closed') && t.created_at
        );
        let avgTime = "0.0";
        if (resolvedWithDates.length > 0) {
          const totalHours = resolvedWithDates.reduce((acc, t) => {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.solution_date_resolved || t.updated_at).getTime();
            return acc + ((end - start) / (1000 * 60 * 60));
          }, 0);
          avgTime = (totalHours / resolvedWithDates.length).toFixed(1);
        }

        return {
          id: service.id,
          name: service.name,
          totalTickets: total,
          resolutionRate: total > 0 ? Math.round((resoluCount / total) * 100) : 0,
          avgTime: avgTime
        };
      });

      if (unassignedTickets.length > 0) {
        servicesWithStats.push({
          id: 0,
          name: "Non Assignés / Autres",
          totalTickets: unassignedTickets.length,
          resolutionRate: 0,
          avgTime: "N/A"
        });
      }

      res.status(200).json({
        services: servicesWithStats,
        totalGlobal: totalTicketsAbsolu
      });

    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({ message: "Erreur récupération services", error: error.message });
    }
  },

  // 2. STATISTIQUES DÉTAILLÉES (Exact clone of Manager's data structure)
getServiceStats: async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const sFilter   = serviceId === 0 ? null : serviceId;

    // ── Parse filter params (same logic as manager controller) ──────────────
    const filterYear  = req.query.year  ? parseInt(req.query.year)  : null;
    const filterMonth = req.query.month ? parseInt(req.query.month) : null;

    let dateFilter = {};
    if (filterYear && filterMonth) {
      dateFilter = {
        created_at: {
          gte: new Date(filterYear, filterMonth - 1, 1),
          lte: new Date(filterYear, filterMonth, 0, 23, 59, 59)
        }
      };
    } else if (filterYear) {
      dateFilter = {
        created_at: {
          gte: new Date(filterYear, 0, 1),
          lte: new Date(filterYear, 11, 31, 23, 59, 59)
        }
      };
    }

    // ── Service name ─────────────────────────────────────────────────────────
    let serviceName = "Non Assignés";
    if (serviceId !== 0) {
      const service = await prisma.services.findUnique({
        where: { id: serviceId },
        select: { name: true }
      });
      if (!service) return res.status(404).json({ message: "Service non trouvé" });
      serviceName = service.name;
    }

    // ── 1. Fetch Enums ────────────────────────────────────────────────────────
    const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
    ]);

    const allStatuses   = dbStatuses.map(r => r.enumlabel);
    const allPriorities = dbPriorities.map(r => r.enumlabel);
    const allCategories = dbCategories.map(r => r.enumlabel);

    // ── 2. Technician Performance (filtered) ──────────────────────────────────
    const techPerformanceRaw = await prisma.users.findMany({
      where: { service_id: sFilter, role: 'technician' },
      select: {
        name: true,
        surname: true,
        tickets_tickets_assigned_toTousers: {
          where: Object.keys(dateFilter).length ? dateFilter : undefined,
          select: { status: true }
        }
      }
    });

    const techPerformance = techPerformanceRaw.map(t => {
      const tkts         = t.tickets_tickets_assigned_toTousers;
      const totalAssigned = tkts.length;
      const resolved      = tkts.filter(tk => tk.status === 'resolved').length;
      const rejected      = tkts.filter(tk => tk.status === 'rejected').length;
      const closed        = tkts.filter(tk => tk.status === 'closed').length;
      return {
        name: `${t.name} ${t.surname}`,
        totalAssigned,
        resolu: resolved,
        ferme: closed,
        rejete: rejected,
        resolutionRate: totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0
      };
    });

    // ── 3. Grouped counts (filtered) ──────────────────────────────────────────
    const baseWhere = { service_id: sFilter, ...dateFilter };

    const [statusCounts, priorityCounts, categoryCounts, typeCounts] = await Promise.all([
      prisma.tickets.groupBy({ by: ['status'],   where: baseWhere, _count: { id: true } }),
      prisma.tickets.groupBy({ by: ['priority'], where: baseWhere, _count: { id: true } }),
      prisma.tickets.groupBy({ by: ['category'], where: baseWhere, _count: { id: true } }),
      prisma.tickets.groupBy({ by: ['type'],     where: baseWhere, _count: { id: true } })
    ]);

    const totalTickets  = await prisma.tickets.count({ where: baseWhere });
    const resolvedCount = await prisma.tickets.count({ where: { ...baseWhere, status: 'resolved' } });

    const statusStats   = allStatuses.map(label => ({ name: label, value: statusCounts.find(s => s.status === label)?._count.id   || 0 }));
    const priorityStats = allPriorities.map(label => ({ name: label, value: priorityCounts.find(p => p.priority === label)?._count.id || 0 }));
    const categoryStats = allCategories.map(label => ({ name: label, value: categoryCounts.find(c => c.category === label)?._count.id || 0 }));
    const typeStats     = typeCounts.map(t => ({
      name: t.type || 'Inconnu',
      value: t._count.id,
      percentage: totalTickets > 0 ? Math.round((t._count.id / totalTickets) * 100) : 0
    }));

// ── 4. SLA (filtered) ─────────────────────────────────────────────────────
const allTicketsForSla = await prisma.tickets.findMany({
  where: baseWhere,
  select: {
    status: true,
    sla_date_limite: true,
    solution_date_resolved: true,
    closed_at: true,
    updated_at: true
  }
});

const now = new Date();
let overdueCount = 0;

for (const ticket of allTicketsForSla) {
  if (!ticket.sla_date_limite) continue;
  const deadline = new Date(ticket.sla_date_limite);
  let comparisonDate;
  if (ticket.status === 'resolved') {
    comparisonDate = ticket.solution_date_resolved ? new Date(ticket.solution_date_resolved) : new Date(ticket.updated_at);
  } else if (ticket.status === 'closed') {
    comparisonDate = ticket.closed_at ? new Date(ticket.closed_at) : new Date(ticket.updated_at);
  } else if (ticket.status === 'rejected') {
    comparisonDate = new Date(ticket.updated_at);
  } else {
    comparisonDate = now;
  }
  if (comparisonDate > deadline) overdueCount++;
}

    // ── 5. Monthly / Daily trend (filtered) ───────────────────────────────────
    const currentYear = filterYear || new Date().getFullYear();
    let monthlyStats  = [];

    if (!filterMonth) {
      // Full year → monthly breakdown
      const monthlyRaw = await prisma.tickets.findMany({
        where: {
          service_id: sFilter,
          created_at: { gte: new Date(currentYear, 0, 1), lte: new Date(currentYear, 11, 31, 23, 59, 59) }
        },
        select: { created_at: true }
      });
      const months       = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
      const monthlyGroups = {};
      months.forEach(m => { monthlyGroups[m] = 0; });
      monthlyRaw.forEach(t => { monthlyGroups[months[new Date(t.created_at).getMonth()]]++; });
      monthlyStats = months.map(m => ({ month: m, value: monthlyGroups[m] }));
    } else {
      // Specific month → daily breakdown
      const daysInMonth = new Date(currentYear, filterMonth, 0).getDate();
      const dailyRaw    = await prisma.tickets.findMany({
        where: {
          service_id: sFilter,
          created_at: {
            gte: new Date(currentYear, filterMonth - 1, 1),
            lte: new Date(currentYear, filterMonth - 1, daysInMonth, 23, 59, 59)
          }
        },
        select: { created_at: true }
      });
      const dailyGroups = {};
      for (let d = 1; d <= daysInMonth; d++) dailyGroups[d] = 0;
      dailyRaw.forEach(t => { dailyGroups[new Date(t.created_at).getDate()]++; });
      monthlyStats = Object.entries(dailyGroups).map(([day, value]) => ({ month: `J${day}`, value }));
    }

    // ── 6. Available years for filter dropdown ────────────────────────────────
    const yearsRaw = await prisma.$queryRaw`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
      FROM tickets
      WHERE service_id = ${sFilter}
      ORDER BY year DESC
    `;
    const availableYears = yearsRaw.map(r => r.year);

    // ── 7. Service-level resolution rate ──────────────────────────────────────
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

    res.json({
      serviceName,
      totalTickets,
      resolvedCount,
      resolutionRate,
      slaStats: [
        { name: 'Respecté', value: totalTickets - overdueCount },
        { name: 'Dépassé',  value: overdueCount }
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

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Erreur statistiques", error: error.message });
  }
},

  // 3. GLOBAL STATS (Helper)
  getGlobalStats: async (req, res) => {
    try {
      const services = await prisma.services.findMany({ include: { tickets: true } });
      let totalGlobal = 0;
      const servicesFormatted = services.map(service => {
        const total = service.tickets.length;
        totalGlobal += total;
        const resCount = service.tickets.filter(t => t.status === 'resolved').length;
        return {
          id: service.id,
          name: service.name,
          totalTickets: total,
          resolutionRate: total > 0 ? Math.round((resCount / total) * 100) : 0
        };
      });
      res.json({ totalGlobal, services: servicesFormatted });
    } catch (error) {
      res.status(500).json({ message: "Erreur globales", error: error.message });
    }
  },

  // 4. CHEF PERFORMANCE STATS — aggregates ALL services belonging to this chef
  // Route: GET /api/chef/stats/:chefId?year=YYYY&month=MM
  getChefStats: async (req, res) => {
    try {
      const chefId = parseInt(req.params.chefId);
      const year   = req.query.year  ? parseInt(req.query.year)  : null;
      const month  = req.query.month ? parseInt(req.query.month) : null;

      // 1. Get the chef user and their service_id
      const chefUser = await prisma.users.findUnique({
        where: { id: chefId },
        select: { service_id: true, name: true, surname: true }
      });

      if (!chefUser) {
        return res.status(404).json({ message: "Chef introuvable" });
      }

      // If service_id is NULL → chef manages ALL services
      // If service_id is set  → chef manages only that service
      const chefServices = await prisma.services.findMany({
        where: chefUser.service_id ? { id: chefUser.service_id } : undefined,
        select: { id: true, name: true }
      });

      const serviceIds   = chefServices.map(s => s.id);
      const serviceNames = chefServices.map(s => s.name).join(', ');

      if (serviceIds.length === 0) {
        return res.json({
          serviceNames: '',
          totalTickets: 0,
          resolvedCount: 0,
          resolutionRate: 0,
          slaStats: [{ name: 'Respecté', value: 0 }, { name: 'Dépassé', value: 0 }],
          serviceBreakdown: [],
          techPerformance: [],
          statusStats: [],
          priorityStats: [],
          categoryStats: [],
          typeStats: [],
          monthlyStats: [],
          availableYears: []
        });
      }

      // 2. Date filter
      let dateFilter = {};
      if (year && month) {
        dateFilter = {
          created_at: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59)
          }
        };
      } else if (year) {
        dateFilter = {
          created_at: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59)
          }
        };
      }

      const baseWhere = { service_id: { in: serviceIds }, ...dateFilter };

      // 3. Fetch enums
      const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
      ]);

      const allStatuses   = dbStatuses.map(r => r.enumlabel);
      const allPriorities = dbPriorities.map(r => r.enumlabel);
      const allCategories = dbCategories.map(r => r.enumlabel);

      // 4. Global counts across ALL services
      const [
        totalTickets,
        resolvedCount,
        statusCounts,
        priorityCounts,
        categoryCounts,
        typeCounts
      ] = await Promise.all([
        prisma.tickets.count({ where: baseWhere }),
        prisma.tickets.count({ where: { ...baseWhere, status: 'resolved' } }),
        prisma.tickets.groupBy({ by: ['status'],   where: baseWhere, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['priority'], where: baseWhere, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['category'], where: baseWhere, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['type'],     where: baseWhere, _count: { id: true } })
      ]);

      const resolutionRate = totalTickets > 0
        ? Math.round((resolvedCount / totalTickets) * 100)
        : 0;

// 5. SLA across ALL services
const allTicketsForSla = await prisma.tickets.findMany({
  where: baseWhere,
  select: {
    status: true,
    sla_date_limite: true,
    solution_date_resolved: true,
    closed_at: true,
    updated_at: true
  }
});

const now = new Date();
let overdueCount = 0;

for (const ticket of allTicketsForSla) {
  if (!ticket.sla_date_limite) continue;
  const deadline = new Date(ticket.sla_date_limite);
  let comparisonDate;
  if (ticket.status === 'resolved') {
    comparisonDate = ticket.solution_date_resolved ? new Date(ticket.solution_date_resolved) : new Date(ticket.updated_at);
  } else if (ticket.status === 'closed') {
    comparisonDate = ticket.closed_at ? new Date(ticket.closed_at) : new Date(ticket.updated_at);
  } else if (ticket.status === 'rejected') {
    comparisonDate = new Date(ticket.updated_at);
  } else {
    comparisonDate = now;
  }
  if (comparisonDate > deadline) overdueCount++;
}

const slaStats = [
  { name: 'Respecté', value: totalTickets - overdueCount },
  { name: 'Dépassé',  value: overdueCount }
];

      // 6. Per-service breakdown
      const serviceBreakdown = await Promise.all(
        chefServices.map(async (service) => {
          const sWhere    = { service_id: service.id, ...dateFilter };
          const sTotal    = await prisma.tickets.count({ where: sWhere });
          const sResolved = await prisma.tickets.count({ where: { ...sWhere, status: 'resolved' } });
          return {
            id: service.id,
            name: service.name,
            totalTickets: sTotal,
            resolutionRate: sTotal > 0 ? Math.round((sResolved / sTotal) * 100) : 0
          };
        })
      );

      // 7. Technicians across ALL services
      const techRaw = await prisma.users.findMany({
        where: { service_id: { in: serviceIds }, role: 'technician' },
        select: {
          name: true,
          surname: true,
          service_id: true,
          tickets_tickets_assigned_toTousers: {
            select: { status: true }
          }
        }
      });

      const serviceMap = Object.fromEntries(chefServices.map(s => [s.id, s.name]));

      const techPerformance = techRaw.map(t => {
        const tkts          = t.tickets_tickets_assigned_toTousers;
        const totalAssigned = tkts.length;
        const resolu        = tkts.filter(tk => tk.status === 'resolved').length;
        const rejete        = tkts.filter(tk => tk.status === 'rejected').length;
        return {
          name:           `${t.name} ${t.surname}`,
          serviceName:    serviceMap[t.service_id] || '—',
          totalAssigned,
          resolu,
          rejete,
          resolutionRate: totalAssigned > 0 ? Math.round((resolu / totalAssigned) * 100) : 0
        };
      });

      // 8. Enum-mapped stats
      const statusStats = allStatuses.map(label => ({
        name:  label,
        value: statusCounts.find(s => s.status === label)?._count.id || 0
      }));

      const priorityStats = allPriorities.map(label => ({
        name:  label,
        value: priorityCounts.find(p => p.priority === label)?._count.id || 0
      }));

      const categoryStats = allCategories.map(label => ({
        name:  label,
        value: categoryCounts.find(c => c.category === label)?._count.id || 0
      }));

      const typeStats = typeCounts.map(t => ({
        name:       t.type || 'Inconnu',
        value:      t._count.id,
        percentage: totalTickets > 0 ? Math.round((t._count.id / totalTickets) * 100) : 0
      }));

      // 9. Monthly / daily trend
      let monthlyStats = [];
      if (month && year) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyRaw = await prisma.tickets.findMany({
          where: baseWhere,
          select: { created_at: true }
        });
        const dailyGroups = {};
        for (let d = 1; d <= daysInMonth; d++) dailyGroups[d] = 0;
        dailyRaw.forEach(t => {
          const day = new Date(t.created_at).getDate();
          dailyGroups[day] = (dailyGroups[day] || 0) + 1;
        });
        monthlyStats = Object.entries(dailyGroups).map(([day, value]) => ({
          month: String(day), value
        }));
      } else {
        const targetYear = year || new Date().getFullYear();
        const monthlyRaw = await prisma.tickets.findMany({
          where: {
            service_id: { in: serviceIds },
            created_at: {
              gte: new Date(targetYear, 0, 1),
              lte: new Date(targetYear, 11, 31, 23, 59, 59)
            }
          },
          select: { created_at: true }
        });
        const monthNames  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
        const monthGroups = {};
        monthNames.forEach(m => { monthGroups[m] = 0; });
        monthlyRaw.forEach(t => {
          const mName = monthNames[new Date(t.created_at).getMonth()];
          monthGroups[mName]++;
        });
        monthlyStats = monthNames.map(m => ({ month: m, value: monthGroups[m] }));
      }

      // 10. Available years for dropdown filter
      const allTicketDates = await prisma.tickets.findMany({
        where: { service_id: { in: serviceIds } },
        select: { created_at: true }
      });
      const availableYears = [...new Set(
        allTicketDates.map(t => new Date(t.created_at).getFullYear())
      )].sort((a, b) => b - a);

      // 11. Send response
      res.json({
        serviceNames,
        totalTickets,
        resolvedCount,
        resolutionRate,
        slaStats,
        serviceBreakdown,
        techPerformance,
        statusStats,
        priorityStats,
        categoryStats,
        typeStats,
        monthlyStats,
        availableYears
      });

    } catch (error) {
      console.error("Chef Stats Error:", error);
      res.status(500).json({ message: "Erreur statistiques chef", error: error.message });
    }
  }
};

module.exports = chefController;