const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

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
/*  LOGIN API                    */
/* ============================= */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Email received:", email);
  console.log("Password received:", password);

  try {
    const userResult = await pool.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    );

    console.log("User found:", userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    console.log("Password in DB:", user.password);

    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.json({
      token: "dummy-token",
      role: user.role,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});