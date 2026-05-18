const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardData = async (req, res) => {
  try {
    const userId   = req.user.id;
    const userRole = req.user.role;

    /* ─────────────── EMPLOYEE ─────────────── */
    if (userRole === 'employee') {
      const [total, resolved, open, in_progress] = await Promise.all([
        prisma.ticket.count({ where: { created_by: userId } }),
        prisma.ticket.count({ where: { created_by: userId, status: 'resolved' } }),
        prisma.ticket.count({ where: { created_by: userId, status: 'open' } }),
        prisma.ticket.count({ where: { created_by: userId, status: 'in_progress' } }),
      ]);

      const ticketList = await prisma.ticket.findMany({
        where:   { created_by: userId },
        orderBy: { updated_at: 'desc' },
        select: {
          id:         true,
          title:      true,
          priority:   true,
          status:     true,
          created_at: true,
          updated_at: true,
          service: { select: { name: true } },
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
      const now       = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1); // 1er janvier année courante

      // ── Stats cards ──────────────────────────────────────────────────────
      // Statuts "actifs" (non fermés / non rejetés)
      const ACTIVE_STATUSES = ['open', 'in_progress', 'pending', 'pending_supplier', 'resolved'];
      const CLOSED_STATUSES  = ['closed', 'rejected', 'resolved'];

      const [
        overdue,        // en retard : SLA dépassée, ticket non terminal
        inProgress,     // en cours
        pending,        // en attente (pending + pending_supplier)
        totalActive,    // total "vivant" : open + in_progress + pending + pending_supplier + resolved
      ] = await Promise.all([
        // En retard
        prisma.ticket.count({
          where: {
            assigned_to:     userId,
            sla_date_limite: { lt: now },
            status:          { notIn: CLOSED_STATUSES },
          },
        }),
        // En cours
        prisma.ticket.count({
          where: { assigned_to: userId, status: 'in_progress' },
        }),
        // En attente (pending + pending_supplier)
        prisma.ticket.count({
          where: {
            assigned_to: userId,
            status:      { in: ['pending', 'pending_supplier'] },
          },
        }),
        // Total actif (résolu + en cours + attente + open)
        prisma.ticket.count({
          where: {
            assigned_to: userId,
            status:      { in: ACTIVE_STATUSES },
          },
        }),
      ]);

      // ── Graphe priorité : on exclut closed et rejected ───────────────────
      const priorityCounts = await prisma.ticket.groupBy({
        by:    ['priority'],
        where: {
          assigned_to: userId,
          status:      { in: ['open','in_progress','pending','pending_supplier','resolved'] },
        },
        _count: { id: true },
      });

      const PRIORITY_LABELS = {
        high:     'Haute',
        medium:   'Moyenne',
        low:      'Faible',
      };
      const PRIORITY_ORDER = ['high', 'medium', 'low'];

      const priorityData = PRIORITY_ORDER.map(p => ({
        name:  PRIORITY_LABELS[p] || p,
        key:   p,
        value: priorityCounts.find(r => r.priority === p)?._count.id || 0,
      })).filter(d => d.value > 0);

      // ── Graphe états d'avancement : année courante uniquement ─────────────
      // On agrège par mois et par statut pour l'année courante
      const statusByMonth = await prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM assigned_at)::int AS month,
          status,
          COUNT(*)::int AS cnt
        FROM ticket
        WHERE assigned_to = ${userId}
          AND assigned_at >= ${yearStart}
          AND assigned_at < ${new Date(now.getFullYear() + 1, 0, 1)}
          AND assigned_at IS NOT NULL
        GROUP BY month, status
        ORDER BY month
      `;

      const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
      const currentMonth = now.getMonth() + 1;

      const statusTimelineData = Array.from({ length: currentMonth }, (_, i) => {
        const month = i + 1;
        const rows  = statusByMonth.filter(r => Number(r.month) === month);
        const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
        const resolved = rows
          .filter(r => r.status === 'resolved' || r.status === 'closed')
          .reduce((s, r) => s + Number(r.cnt), 0);
        return { name: MONTHS_FR[i], 'Tickets': total, 'Résolu': resolved };
      });

      // ── Graphe catégories : filtré par service du technicien ──────────────
      // Récupérer le service_id du technicien
      const techUser = await prisma.user.findUnique({
        where:  { id: userId },
        select: { service_id: true },
      });

      const categoryFilter = {
        assigned_to: userId,
        status:      { in: ['open','in_progress','pending','pending_supplier','resolved'] },
        ...(techUser?.service_id && { service_id: techUser.service_id }),
      };

      const categoryCounts = await prisma.ticket.groupBy({
        by:    ['category'],
        where: categoryFilter,
        _count: { id: true },
      });

      const CATEGORY_LABELS = {
        hardware:  'Matériel',
        software:  'Logiciel',
        network:   'Réseau',
        security:  'Sécurité',
        access:    'Accès',
        messaging: 'Messagerie',
      };

      const categoryData = categoryCounts.map(c => ({
        name:  CATEGORY_LABELS[c.category] || c.category,
        key:   c.category,
        value: c._count.id,
      })).sort((a, b) => b.value - a.value);

      // ── 5 tickets récemment assignés + leur dernière activité ────────────
      const top5Tickets = await prisma.ticket.findMany({
        where:   { assigned_to: userId, assigned_at: { not: null } },
        orderBy: { assigned_at: 'desc' },
        take:    5,
        select: {
          id: true, title: true, priority: true, status: true, assigned_at: true,
          message: {
            orderBy: { created_at: 'desc' },
            take: 1,
            where: { comment_type: { in: ['status','confirm','solution','info','reopen','assigned'] } },
            select: { comment: true, comment_type: true, created_at: true },
          },
        },
      });

      const ACT_LABEL = { confirm:'Confirmation demandée', solution:'Solution envoyée', info:'Info demandée', reopen:'Ticket réouvert', assigned:'Ticket assigné', status:'Statut mis à jour' };

      const recentActivities = top5Tickets.map(t => ({
        ticketId:    t.id,
        ticketTitle: t.title,
        priority:    t.priority,
        status:      t.status,
        assigned_at: t.assigned_at,
        lastActivity: t.message[0] ? {
          type:  t.message[0].comment_type,
          label: ACT_LABEL[t.message[0].comment_type] || t.message[0].comment?.slice(0,40),
          date:  t.message[0].created_at,
        } : null,
      }));

      return res.json({
        type:   'technician',
        stats:  {
          overdue,
          inProgress,
          pending,
          total: totalActive,
        },
        charts: {
          priorityData,
          statusTimelineData,
          categoryData,
        },
        recentActivities,
      });
    }

    return res.status(403).json({ error: 'Role non autorisé' });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
};

module.exports = { getDashboardData };