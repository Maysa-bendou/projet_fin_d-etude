const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  // Services
  const services = JSON.parse(fs.readFileSync("prisma/seed/services.json", "utf-8"));
  await prisma.service.createMany({ data: services, skipDuplicates: true });

  // Users
  const users = JSON.parse(fs.readFileSync("prisma/seed/users.json", "utf-8"));
  await prisma.user.createMany({ data: users, skipDuplicates: true });

  // Tickets
  const tickets = JSON.parse(fs.readFileSync("prisma/seed/tickets.json", "utf-8"));
  await prisma.ticket.createMany({ data: tickets });

  // Ticket comments
  const comments = JSON.parse(fs.readFileSync("prisma/seed/ticket_comments.json", "utf-8"));
  await prisma.ticket_comments.createMany({ data: comments });

  // Attachments
  const attachments = JSON.parse(fs.readFileSync("prisma/seed/ticket_attachments.json", "utf-8"));
  await prisma.ticket_attachments.createMany({ data: attachments });

  // Assignment history
  const history = JSON.parse(fs.readFileSync("prisma/seed/ticket_assignments_history.json", "utf-8"));
  await prisma.ticket_history.createMany({ data: history });

  // SLA Config
  const slaConfig = JSON.parse(fs.readFileSync("prisma/seed/slaConfig.json", "utf-8"));
  await prisma.sla_config.createMany({ data: slaConfig, skipDuplicates: true });

  console.log("Database seeded successfully!");

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());