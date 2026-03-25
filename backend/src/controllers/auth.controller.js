const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user)
      return res.status(401).json({ message: "Email introuvable" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
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

// ─── PROFILE (JWT protected) ──────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Non autorisé" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Get user
    const user = await prisma.users.findUnique({
      where: { id: decoded.id }
    });

    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    // ✅ If technician → fetch services via join table
    let services = [];
    if (user.role === "technician") {
      const techServices = await prisma.technician_services.findMany({
        where: { user_id: user.id },
        include: { services: true } // joins services table
      });
      // extract just the service names into a simple array
      services = techServices.map(ts => ts.services?.name).filter(Boolean);
    }

    const { password: _, ...safeUser } = user;

    // ✅ Return user + services array (empty [] for non-technicians)
    res.json({ ...safeUser, services });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// ─── MIGRATE PLAIN-TEXT PASSWORDS (run once then remove) ─────────────────────
const migratePasswords = async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    let count = 0;

    for (const user of users) {
      if (user.password.startsWith("$2b$")) continue; // already hashed

      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      count++;
    }

    res.json({ message: `Migration done. ${count} passwords hashed.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Migration failed" });
  }
};

module.exports = { login, getProfile, migratePasswords };