const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";

// ─── LOGIN ───────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.status(401).json({ message: "Email introuvable" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role.toString() },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { login };