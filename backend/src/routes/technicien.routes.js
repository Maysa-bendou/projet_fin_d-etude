const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

const {
  getTicketDetailTech,
  updateTicketStatus,
  sendSolution,
  requestConfirmation,
  closeTicketManually,
  redirectTicket,
  getServices,
  getAllTechniciens,
  getAssignedTickets,
  getEnums,
} = require("../controllers/technicien.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../../uploads/tickets/${req.params.id}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/tickets/:id",                 getTicketDetailTech);
router.put("/tickets/:id/status",          updateTicketStatus);
router.post("/tickets/:id/send",           upload.array("files", 10), sendSolution);
router.put("/tickets/:id/request-confirm", requestConfirmation);
router.put("/tickets/:id/close-manual",    closeTicketManually);
router.put("/tickets/:id/redirect",        redirectTicket);
router.get("/services",                    getServices);
router.get("/techniciens",                 getAllTechniciens);
router.get("/assigned/:techId",            getAssignedTickets);
router.get("/enums",                       getEnums);

module.exports = router;