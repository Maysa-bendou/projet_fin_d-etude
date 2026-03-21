const express = require("express");
const cors = require("cors");
const pool = require("./db");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "djezzy_secret_key_2024";

/* ============================= */
/*  TEST DATABASE CONNECTION     */
/* ============================= */
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* ============================= */
/*  LOGIN                        */
/* ============================= */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ message: "Utilisateur non trouvé" });

    const user = result.rows[0];

    if (password !== user.password)
      return res.status(401).json({ message: "Mot de passe incorrect" });

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, role: user.role });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ============================= */
/*  MIDDLEWARE - Verify Token    */
/* ============================= */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

/* ============================= */
/*  PROFILE                      */
/* ============================= */
app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, surname, email, phone, department,
              job_title, office, block_number, role
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ============================= */
/*  START SERVER                 */
/* ============================= */
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});