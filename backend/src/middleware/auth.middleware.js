const jwt = require("jsonwebtoken");

// Use the same secret as your login controller
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_in_prod";

const verifyToken = (req, res, next) => {
  // Get token from header (Format: "Bearer <token>")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Token manquant." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    // This attaches { id, role } to the request object
    req.user = verified; 
    next();
  } catch (err) {
    res.status(403).json({ message: "Token invalide ou expiré." });
  }
};

module.exports = { verifyToken };