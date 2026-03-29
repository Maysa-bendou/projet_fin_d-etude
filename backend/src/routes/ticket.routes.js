const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ticket_systeme",
  password: "maysab43",
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
router.get("/assigned/:techId", async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);

    const result = await pool.query(`
      SELECT 
        t.*,
        u.name || ' ' || u.surname AS technicien_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
    `, [techId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch technician tickets" });
  }
});
// GET /api/tickets/my - fetch only tickets created by the logged-in employee
router.get("/my/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `
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
      WHERE t.created_by = $1
      ORDER BY t.created_at DESC
      `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching employee tickets:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});
                 router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});
module.exports = router;