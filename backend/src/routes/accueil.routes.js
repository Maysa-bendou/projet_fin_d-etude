const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/accueil.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Use verifyToken to get req.user (id and role) from the JWT
router.get('/dashboard', verifyToken, getDashboardData);

module.exports = router;