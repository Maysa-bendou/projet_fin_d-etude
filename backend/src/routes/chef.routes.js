const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chef.controller');

// URL: http://localhost:3001/api/services
router.get('/services', chefController.getAllServices);

// URL: http://localhost:3001/api/chef/stats/service/:serviceId
// We use "/chef" here so it doesn't conflict with the manager's personal stats
router.get('/chef/stats/service/:serviceId', chefController.getServiceStats);

router.get('/services/global-stats', chefController.getGlobalStats);

module.exports = router;