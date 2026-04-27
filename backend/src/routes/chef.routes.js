const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chef.controller');

// URL: http://localhost:3001/api/services
router.get('/services', chefController.getAllServices);

// URL: http://localhost:3001/api/chef/stats/service/:serviceId
router.get('/chef/stats/service/:serviceId', chefController.getServiceStats);

// URL: http://localhost:3001/api/services/global-stats
router.get('/services/global-stats', chefController.getGlobalStats);

// ✅ ADD THIS — URL: http://localhost:3001/api/chef/stats/:chefId
router.get('/chef/stats/:chefId', chefController.getChefStats);

module.exports = router;