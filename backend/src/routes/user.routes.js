const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

router.get("/", userController.getAllUsers);
router.put("/:id/toggle-active", userController.toggleActive);
router.post("/", userController.createUser); // ajouter utilisateur
router.put("/:id", userController.updateUser); // modifier utilisateur

router.get("/services", userController.getServices);

module.exports = router;