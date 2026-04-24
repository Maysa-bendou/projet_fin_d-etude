const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardData = async (req, res) => {
  try {
    const userId   = req.user.id;
    const userRole = req.user.role;

    /* ─────────────── EMPLOYEE ─────────────── */
    if (userRole === 'employee') {

      const [total, resolved, open, in_progress] = await Promise.all([
        prisma.tickets.count({ where: { created_by: userId } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'resolved' } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'open' } }),
        prisma.tickets.count({ where: { created_by: userId, status: 'in_progress' } }),
      ]);

      const ticketList = await prisma.tickets.findMany({
        where:   { created_by: userId },
        orderBy: { updated_at: 'desc' },
        select: {
          id:         true,
          title:      true,
          priority:   true,
          status:     true,
          created_at: true,
          updated_at: true,
          services: {
            select: { name: true },
          },
        },
      });

      return res.json({
        type:    'employee',
        stats:   { total, resolved, open, in_progress },
        tickets: ticketList,
      });
    }

    /* ─────────────── TECHNICIAN ─────────────── */
    if (userRole === 'technician') {
      const now = new Date();

      const [overdue, myOpen, totalAssigned, in_progress] = await Promise.all([
        prisma.tickets.count({
          where: {
            assigned_to:  userId,
            sla_due_date: { lt: now },
            NOT: { status: 'resolved' },
          },
        }),
        prisma.tickets.count({ where: { assigned_to: userId, status: 'open' } }),
        prisma.tickets.count({ where: { assigned_to: userId } }),
        prisma.tickets.count({ where: { assigned_to: userId, status: 'in_progress' } }),
      ]);

      const [dbStatuses, dbPriorities, dbCategories] = await Promise.all([
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ticket_status_enum' ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'priority_enum'       ORDER BY enumsortorder`,
        prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'category_enum'       ORDER BY enumsortorder`,
      ]);

      const [statusCounts, priorityCounts, categoryCounts] = await Promise.all([
        prisma.tickets.groupBy({ by: ['status'],   where: { assigned_to: userId }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['priority'], where: { assigned_to: userId }, _count: { id: true } }),
        prisma.tickets.groupBy({ by: ['category'], where: { assigned_to: userId }, _count: { id: true } }),
      ]);

      const statusData   = dbStatuses.map(r   => ({ name: r.enumlabel, value: statusCounts.find(s   => s.status   === r.enumlabel)?._count.id || 0 }));
      const priorityData = dbPriorities.map(r => ({ name: r.enumlabel, value: priorityCounts.find(p => p.priority === r.enumlabel)?._count.id || 0 }));
      const categoryData = dbCategories.map(r => ({ name: r.enumlabel, value: categoryCounts.find(c => c.category === r.enumlabel)?._count.id || 0 }));

      return res.json({
        type:   'technician',
        stats:  { overdue, open: myOpen, total: totalAssigned, in_progress, dueToday: 0 },
        charts: { statusData, priorityData, categoryData },
      });
    }

    return res.status(403).json({ error: 'Role non autorisé' });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
};

module.exports = { getDashboardData };