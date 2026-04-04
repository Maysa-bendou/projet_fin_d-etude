const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

// GET SLA
router.get("/", async (req, res) => {
  const data = await prisma.sla_config.findMany();
  res.json(data);
});

// UPDATE SLA
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { duration_hours } = req.body;

  const updated = await prisma.sla_config.update({
    where: { id },
    data: { duration_hours }
  });

  res.json(updated);
});

module.exports = router;