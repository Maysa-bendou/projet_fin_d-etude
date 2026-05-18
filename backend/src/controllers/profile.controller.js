const prisma = require("../prismaClient");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";

// ─── PROFILE ───────────────────────────────────────
const getProfile = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Non autorisé" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { service: true }
    });

    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    const { password: _, ...safeUser } = user;

    res.json(safeUser);

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = { getProfile };