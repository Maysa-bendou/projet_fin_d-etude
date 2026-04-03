const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";

// Middleware to verify token and attach user to req
const authenticate = async (req, res, next) => {
  console.log('Auth middleware called for:', req.path);
  const authHeader = req.headers.authorization;
  console.log('Auth header:', !!authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Non autorisé" });

  try {
    const token = authHeader.split(" ")[1];
    console.log('Token length:', token?.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    const user = await prisma.users.findUnique({ where: { id: decoded.id } });
    console.log('Found user:', !!user, user?.role);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    req.user = user; // attach user to request
    console.log('req.user.role:', req.user.role);
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};


module.exports = { authenticate };