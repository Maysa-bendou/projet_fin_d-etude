const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllTickets = async (req, res) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
};

const getTicketById = async (req, res) => {
  const id = parseInt(req.params.id);
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });
  res.json(ticket);
};

module.exports = {
  getAllTickets,
  getTicketById,
};