const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ticket_systeme",
  password: "amml",
  port: 5432,
});

// GET /api/tickets - fetch all tickets with technician name
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.category,
        t.status,
        t.priority,
        t.impact,
        t.urgency,
        t.service_id,
        t.created_at,
        t.updated_at,
        u.name || ' ' || u.surname AS technicien_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// GET /api/tickets/:id - fetch single ticket with technician name
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT 
        t.*,
        u.name || ' ' || u.surname AS technicien_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Ticket non trouvé" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;