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
  deleteAttachment,
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
router.put("/tickets/:id/close-manual",    upload.array("files", 10), closeTicketManually);
router.put("/tickets/:id/redirect",        redirectTicket);
router.get("/services",                    getServices);
router.get("/techniciens",                 getAllTechniciens);


router.get("/techniciens/service/:serviceId", async (req, res) => {  // ← ici
  try {
    const prisma = require("../prismaClient");
    const techs = await prisma.users.findMany({
      where: { role: "technician", is_active: true, service_id: parseInt(req.params.serviceId) },
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/assigned/:techId",            getAssignedTickets);
router.get("/enums",                       getEnums);
router.delete("/attachments/:id", deleteAttachment);
router.put("/tickets/:id/clear-solution", async (req, res) => {
  try {
    const prisma = require("../prismaClient");
    await prisma.tickets.update({
      where: { id: parseInt(req.params.id) },
      data: { solution: null, updated_at: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
module.exports = router;