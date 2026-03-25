const express = require("express");
const router = express.Router();
const { login, getProfile, migratePasswords } = require("../controllers/auth.controller");

router.post("/login", login);
router.get("/profile", getProfile);

// ⚠️ Run once to hash existing plain passwords, then REMOVE this route
router.get("/migrate-passwords", migratePasswords);

router.get("/delete-wrong-services", async (req, res) => {
  try {
    await prisma.technician_services.deleteMany({
      where: {
        user_id: { in: [19, 20] }
      }
    });
    res.json({ message: "Done! Rows deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;




