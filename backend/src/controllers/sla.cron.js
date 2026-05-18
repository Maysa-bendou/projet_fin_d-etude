// controllers/sla.cron.js
const prisma = require("../prismaClient");

const ALERT_WINDOW_MS = 30 * 60 * 1000; // alerte 30 min avant dépassement

async function checkSlaAlerts() {
  const now  = new Date();
  const soon = new Date(now.getTime() + ALERT_WINDOW_MS);

  // Tickets actifs dont le SLA expire bientôt ou déjà dépassé
  const tickets = await prisma.ticket.findMany({
    where: {
      status:          { in: ["open", "in_progress"] },
      sla_statut:      "en_cours",          // pas déjà traité
      sla_date_limite: { lte: soon },
    },
    select: {
      id:              true,
      title:           true,
      assigned_to:     true,
      service_id:      true,
      sla_date_limite: true,
    },
  });

  for (const ticket of tickets) {
    const isExpired    = ticket.sla_date_limite <= now;
    const isUnassigned = !ticket.assigned_to;

    if (isUnassigned) {
      // Notifier managers + techniciens du même service
      await notifyServiceUsers(ticket, isExpired);
    } else {
      // Notifier uniquement le technicien assigné
      await notifyAssignedTech(ticket, isExpired);
    }

    // Marquer sla_statut = "depasse" pour ne plus re-notifier
    if (isExpired) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data:  { sla_statut: "depasse" },
      });
    }
  }
}

// ── Managers + techniciens du même service que le ticket ─────────────────
async function notifyServiceUsers(ticket, isExpired) {
  if (!ticket.service_id) return;

  // Cherche tous les users du même service avec le bon rôle
  const users = await prisma.user.findMany({
    where: {
      is_active:  true,
      service_id: ticket.service_id,                     
      role: { in: ["manager", "director", "technician"] },
    },
    select: { id: true },
  });

  for (const user of users) {
    // Déduplication : une seule notif SLA par ticket + user
    const already = await prisma.notifications.findFirst({
      where: { user_id: user.id, ticket_id: ticket.id, type: "sla" },
    });
    if (already) continue;

    const msg = isExpired
      ? `⚠️ SLA dépassé — Ticket #${ticket.id} "${ticket.title}" non assigné (votre service)`
      : `🕐 SLA bientôt dépassé — Ticket #${ticket.id} "${ticket.title}" non assigné (votre service)`;

    await prisma.notifications.create({
      data: {
        user_id:   user.id,
        ticket_id: ticket.id,
        type:      "sla",
        message:   msg,
        is_read:   false,
      },
    });
  }
}

// ── Technicien assigné au ticket ──────────────────────────────────────────
async function notifyAssignedTech(ticket, isExpired) {
  const already = await prisma.notifications.findFirst({
    where: { user_id: ticket.assigned_to, ticket_id: ticket.id, type: "sla" },
  });
  if (already) return;

  const msg = isExpired
    ? `⚠️ SLA dépassé — Ticket #${ticket.id} "${ticket.title}" vous est assigné`
    : `🕐 SLA bientôt dépassé — Ticket #${ticket.id} "${ticket.title}" vous est assigné`;

  await prisma.notifications.create({
    data: {
      user_id:   ticket.assigned_to,
      ticket_id: ticket.id,
      type:      "sla",
      message:   msg,
      is_read:   false,
    },
  });
}

module.exports = { checkSlaAlerts };