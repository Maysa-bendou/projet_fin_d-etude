const express = require("express");
const router = express.Router();
const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  sendMessage,
} = require("../controllers/tech.controller");

router.get("/tickets", getAllTickets);
router.get("/tickets/:id", getTicketById);
router.patch("/tickets/:id/status", updateTicketStatus);
router.post("/tickets/:id/:type", sendMessage); // type = 'solution' or 'info'

module.exports = router;