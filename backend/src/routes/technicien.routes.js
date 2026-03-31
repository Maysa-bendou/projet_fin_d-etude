const express = require("express");
const router  = express.Router();
const {
  getTicketDetailTech,
  getAllTechniciens,
  redirectTicket,
} = require("../controllers/technicien.controller");

router.get("/tickets/:id",        getTicketDetailTech);  // détail ticket
router.get("/techniciens",        getAllTechniciens);     // liste techniciens
router.put("/tickets/:id/redirect", redirectTicket);     // rediriger ticket

module.exports = router;