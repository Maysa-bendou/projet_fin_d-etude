const prisma = require("../prismaClient");


// ── Fonction de base ───────────────────────────────────────────────────────
async function createNotification({ userId, ticketId, type, message }) {
  try {
    await prisma.notifications.create({
      data: {
        user_id:   userId,
        ticket_id: ticketId ?? null,
        type,
        message,
      },
    });
  } catch (err) {
    console.error("Erreur création notification:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYÉ
// ─────────────────────────────────────────────────────────────────────────────

// Ticket assigné à un technicien
async function notifyEmployeeAssigned(employeeId, ticketId, ticketTitle, techName) {
  await createNotification({
    userId:   employeeId,
    ticketId,
    type:     "assigned",
    message:  `Votre ticket "${ticketTitle}" a été assigné à ${techName}.`,
  });
}

// Changement de statut
async function notifyEmployeeStatusChanged(employeeId, ticketId, ticketTitle, newStatus) {
  const STATUS_FR = {
    open:             "Ouvert",
    in_progress:      "En cours",
    pending:          "En attente",
    pending_supplier: "En attente fournisseur",
    resolved:         "Résolu",
    closed:           "Fermé",
    rejected:         "Rejeté",
  };
  await createNotification({
    userId:   employeeId,
    ticketId,
    type:     "status",
    message:  `Le statut de votre ticket "${ticketTitle}" a changé : ${STATUS_FR[newStatus] ?? newStatus}.`,
  });
}

// Solution envoyée par le technicien
async function notifyEmployeeSolution(employeeId, ticketId, ticketTitle) {
  await createNotification({
    userId:   employeeId,
    ticketId,
    type:     "solution",
    message:  `Le technicien a proposé une solution pour votre ticket "${ticketTitle}".`,
  });
}

// Demande d'information
async function notifyEmployeeInfoRequest(employeeId, ticketId, ticketTitle) {
  await createNotification({
    userId:   employeeId,
    ticketId,
    type:     "info",
    message:  `Le technicien a besoin d'informations supplémentaires pour votre ticket "${ticketTitle}".`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICIEN
// ─────────────────────────────────────────────────────────────────────────────

// Nouveau ticket assigné par le manager
async function notifyTechAssigned(techId, ticketId, ticketTitle) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "assigned",
    message:  `Un nouveau ticket vous a été assigné : "${ticketTitle}".`,
  });
}

// Nouveau ticket dans son service (non assigné)
async function notifyTechNewTicketInService(techId, ticketId, ticketTitle) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "new_ticket",
    message:  `Nouveau ticket dans votre service : "${ticketTitle}".`,
  });
}

// Réponse de l'employé
async function notifyTechEmployeeReply(techId, ticketId, ticketTitle, employeeName) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "emp_reply",
    message:  `${employeeName} a répondu au ticket "${ticketTitle}".`,
  });
}

// Employé a confirmé la résolution
async function notifyTechConfirmed(techId, ticketId, ticketTitle, employeeName) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "confirmed",
    message:  `${employeeName} a confirmé la résolution du ticket "${ticketTitle}".`,
  });
}

// Employé a refusé la solution
async function notifyTechRejected(techId, ticketId, ticketTitle, employeeName) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "rejected_confirm",
    message:  `${employeeName} a refusé la solution du ticket "${ticketTitle}".`,
  });
}

// Modification ou réouverture du ticket par l'employé
async function notifyTechTicketUpdated(techId, ticketId, ticketTitle, employeeName) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "updated",
    message:  `${employeeName} a modifié le ticket "${ticketTitle}".`,
  });
}

// Alerte SLA — à appeler depuis un cron job
async function notifyTechSLA(techId, ticketId, ticketTitle, expired = false) {
  await createNotification({
    userId:   techId,
    ticketId,
    type:     "sla",
    message:  expired
      ? `⚠ SLA dépassé pour le ticket "${ticketTitle}".`
      : `⏰ Le SLA du ticket "${ticketTitle}" expire bientôt.`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER
// ─────────────────────────────────────────────────────────────────────────────

// Nouveau ticket créé dans le service
async function notifyManagerNewTicket(managerId, ticketId, ticketTitle) {
  await createNotification({
    userId:   managerId,
    ticketId,
    type:     "new_ticket",
    message:  `Nouveau ticket créé dans votre service : "${ticketTitle}".`,
  });
}

// Technicien prend en charge un ticket
async function notifyManagerTechTook(managerId, ticketId, ticketTitle, techName) {
  await createNotification({
    userId:   managerId,
    ticketId,
    type:     "assigned",
    message:  `${techName} a pris en charge le ticket "${ticketTitle}".`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE — notifier tous les managers/techs d'un service
// ─────────────────────────────────────────────────────────────────────────────

async function notifyAllManagersOfService(serviceId, ticketId, ticketTitle) {
  const managers = await prisma.users.findMany({
    where: { service_id: serviceId, role: { in: ["manager", "chef_service"] }, is_active: true },
    select: { id: true },
  });
  await Promise.all(
    managers.map(m => notifyManagerNewTicket(m.id, ticketId, ticketTitle))
  );
}

async function notifyAllTechsOfService(serviceId, ticketId, ticketTitle) {
  const techs = await prisma.users.findMany({
    where: { service_id: serviceId, role: "technician", is_active: true },
    select: { id: true },
  });
  await Promise.all(
    techs.map(t => notifyTechNewTicketInService(t.id, ticketId, ticketTitle))
  );
}

module.exports = {
  // Employé
  notifyEmployeeAssigned,
  notifyEmployeeStatusChanged,
  notifyEmployeeSolution,
  notifyEmployeeInfoRequest,
  // Technicien
  notifyTechAssigned,
  notifyTechNewTicketInService,
  notifyTechEmployeeReply,
  notifyTechConfirmed,
  notifyTechRejected,
  notifyTechTicketUpdated,
  notifyTechSLA,
  // Manager
  notifyManagerNewTicket,
  notifyManagerTechTook,
  // Utilitaires
  notifyAllManagersOfService,
  notifyAllTechsOfService,
};