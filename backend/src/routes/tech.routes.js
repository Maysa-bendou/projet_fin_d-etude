const express = require("express");
const router = express.Router();
const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  sendMessage,
  getTechniciansByService, // Add this
  assignTicket,            // Add this
} = require("../controllers/tech.controller");

router.get("/tickets", getAllTickets);
router.get("/tickets/:id", getTicketById);
router.patch("/tickets/:id/status", updateTicketStatus);
router.post("/tickets/:id/:type", sendMessage);

// --- NEW MANAGER ROUTES ---
// Get all technicians belonging to a specific service
router.get("/users/service/:serviceId", getTechniciansByService);

// Assign a ticket to a specific technician (using PUT as in your frontend fetch)
router.put("/tickets/:id/assign", assignTicket);

module.exports = router;