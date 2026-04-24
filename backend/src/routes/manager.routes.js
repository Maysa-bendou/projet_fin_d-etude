const express = require("express");
const router = express.Router();
const { getManagerStats, getActiveTechnicianTicketsCount } = require("../controllers/manager.controller");

// Route to fetch all stats for the logged-in manager
router.get("/stats/:managerId", getManagerStats);

// Route to fetch active tickets count for a technician
router.get("/technician/:techId/active-count", getActiveTechnicianTicketsCount);

module.exports = router;