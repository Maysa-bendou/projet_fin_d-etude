const express = require("express");
const router = express.Router();
const { getManagerStats } = require("../controllers/manager.controller");

// Route to fetch all stats for the logged-in manager
router.get("/stats/:managerId", getManagerStats);

module.exports = router;