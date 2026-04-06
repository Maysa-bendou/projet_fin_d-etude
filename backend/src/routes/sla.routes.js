const express = require("express");
const router  = express.Router();
const prisma  = require("../prismaClient");

router.get("/", async (req, res) => {
  try {
    const data = await prisma.sla_config.findMany();
    res.json(data);
  } catch (err) {
    console.error("Erreur GET /api/sla :", err);
    res.status(500).json({ error: "Erreur serveur SLA" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { duration_hours } = req.body;
  if (!duration_hours || isNaN(duration_hours))
    return res.status(400).json({ error: "duration_hours invalide" });
  try {
    const updated = await prisma.sla_config.update({
      where: { id },
      data: { duration_hours: parseInt(duration_hours) },
    });
    res.json(updated);
  } catch (err) {
    console.error("Erreur PUT /api/sla/:id :", err);
    res.status(500).json({ error: "Erreur mise à jour SLA" });
  }
});

module.exports = router;