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
        
        const resoluCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        
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
      const sFilter = serviceId === 0 ? null : serviceId;

      // Service Name logic
      let serviceName = "Non Assignés";
      if (serviceId !== 0) {
        const service = await prisma.services.findUnique({
          where: { id: serviceId },
          select: { name: true }
        });
        if (!service) return res.status(404).json({ message: "Service non trouvé" });
        serviceName = service.name;
      }

      // ✅ 1. Fetch Enums exactly like manager
      const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
      ]);

      const allStatuses = dbStatuses.map(r => r.enumlabel);
      const allPriorities = dbPriorities.map(r => r.enumlabel);
      const allCategories = dbCategories.map(r => r.enumlabel);

      // ✅ 2. Performance per Technician
      const techPerformanceRaw = await prisma.users.findMany({
        where: { service_id: sFilter, role: 'technician' },
        select: {
          name: true,
          surname: true,
          tickets_tickets_assigned_toTousers: { select: { status: true } }
        }
      });

      const techPerformance = techPerformanceRaw.map(t => {
        const tkts = t.tickets_tickets_assigned_toTousers;
        const totalAssigned = tkts.length;
        const resolved = tkts.filter(tk => ['resolved', 'closed'].includes(tk.status)).length;
        const rejected = tkts.filter(tk => tk.status === 'rejected').length;
        return {
          name: `${t.name} ${t.surname}`,
          totalAssigned,
          resolu: resolved,
          rejete: rejected,
          resolutionRate: totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0
        };
      });

      // ✅ 3. Detailed Counts
      const [statusCounts, priorityCounts, categoryCounts, typeCounts] = await Promise.all([
        prisma.tickets.groupBy({ by: ['status'], where: { service_id: sFilter }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['priority'], where: { service_id: sFilter }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['category'], where: { service_id: sFilter }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['type'], where: { service_id: sFilter }, _count: { id: true } })
      ]);

      const totalTickets = await prisma.tickets.count({ where: { service_id: sFilter } });
      const resolvedCount = await prisma.tickets.count({
        where: { service_id: sFilter, status: { in: ['resolved', 'closed'] } }
      });

      // Mapping Enums
      const statusStats = allStatuses.map(label => ({
        name: label,
        value: statusCounts.find(s => s.status === label)?._count.id || 0
      }));

      const priorityStats = allPriorities.map(label => ({
        name: label,
        value: priorityCounts.find(p => p.priority === label)?._count.id || 0
      }));

      const categoryStats = allCategories.map(label => ({
        name: label,
        value: categoryCounts.find(c => c.category === label)?._count.id || 0
      }));

      // Type Stats with percentage (Incident/Demande)
      const typeStats = typeCounts.map(t => ({
        name: t.type || 'Inconnu',
        value: t._count.id,
        percentage: totalTickets > 0 ? Math.round((t._count.id / totalTickets) * 100) : 0
      }));

      // ✅ 4. SLA Logic
      const now = new Date();
      const overdueCount = await prisma.tickets.count({
        where: { 
          service_id: sFilter, 
          sla_due_date: { lt: now }, 
          status: { notIn: ['resolved', 'closed'] } 
        }
      });

// 5. Monthly Stats (CRITICAL FIX: Use sFilter here)
      const currentYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const monthlyRaw = await prisma.tickets.findMany({
        where: { 
          service_id: sFilter, // FIX: sId changed to sFilter
          created_at: { gte: startOfYear, lte: endOfYear }
        },
        select: { created_at: true }
      });

      const monthsNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      const monthlyGroups = {};
      monthsNames.forEach(m => { monthlyGroups[m] = 0; });

      monthlyRaw.forEach(t => {
        const mIndex = new Date(t.created_at).getMonth();
        const mName = monthsNames[mIndex];
        monthlyGroups[mName]++;
      });

      const monthlyStats = monthsNames.map(m => ({
        month: m,
        value: monthlyGroups[m]
      }));
      res.json({
        serviceName,
        totalTickets,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0,
        slaStats: [
          { name: 'Respecté', value: totalTickets - overdueCount },
          { name: 'Dépassé', value: overdueCount }
        ],
        techPerformance,
        statusStats,
        priorityStats,
        categoryStats,
        typeStats,
        monthlyStats
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
        const resCount = service.tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
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
  }
};

module.exports = chefController;