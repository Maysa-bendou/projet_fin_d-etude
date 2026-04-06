const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id; // From decoded JWT
    const userRole = req.user.role;

    // --- 1. LOGIC FOR AUTHENTICATED EMPLOYEE ---
    if (userRole === 'employee') {
      // Only count tickets CREATED BY this specific user
      const [total, resolved, open, rejected] = await Promise.all([
        prisma.tickets.count({ where: { created_by: userId } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'resolved' } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'open' } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'rejected' } }),
      ]);

      const ticketList = await prisma.tickets.findMany({
        where: { created_by: userId }, // Security: Filter by Authenticated User ID
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          priority: true,
          created_at: true,
          updated_at: true,
          solution: true,
          status: true
        }
      });

      return res.json({ 
        type: 'employee', 
        stats: { total, resolved, open, rejected }, 
        tickets: ticketList 
      });
    }

    // --- 2. LOGIC FOR AUTHENTICATED TECHNICIAN ---
    if (userRole === 'technician') {
      const now = new Date();

      // Only calculate stats for tickets ASSIGNED TO this technician
      const [overdue, myOpen, totalAssigned] = await Promise.all([
        prisma.tickets.count({ 
          where: { 
            assigned_to: userId, 
            sla_due_date: { lt: now }, 
            NOT: { status: 'resolved' } 
          } 
        }),
        prisma.tickets.count({ where: { assigned_to: userId, status: 'open' } }),
        prisma.tickets.count({ where: { assigned_to: userId } }),
      ]);

      // A. Fetch Real Enums for structure (same as ChefController)
      const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum' ORDER BY enumsortorder`
      ]);

      // B. Grouped Counts for Charts (Filtered by assigned_to: userId)
      const [statusCounts, priorityCounts, categoryCounts] = await Promise.all([
        prisma.tickets.groupBy({ by: ['status'], where: { assigned_to: userId }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['priority'], where: { assigned_to: userId }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['category'], where: { assigned_to: userId }, _count: { id: true } })
      ]);

      // C. Formatting data for Recharts (name/value)
      const statusData = dbStatuses.map(r => ({
        name: r.enumlabel,
        value: statusCounts.find(s => s.status === r.enumlabel)?._count.id || 0
      }));

      const priorityData = dbPriorities.map(r => ({
        name: r.enumlabel,
        value: priorityCounts.find(p => p.priority === r.enumlabel)?._count.id || 0
      }));

      const categoryData = dbCategories.map(r => ({
        name: r.enumlabel,
        value: categoryCounts.find(c => c.category === r.enumlabel)?._count.id || 0
      }));

      return res.json({
        type: 'technician',
        stats: { 
          overdue, 
          open: myOpen, 
          total: totalAssigned,
          dueToday: 0 // You can add logic for today's deadline here
        },
        charts: { statusData, priorityData, categoryData }
      });
    }

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getDashboardData };