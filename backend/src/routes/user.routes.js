const express = require("express");
const router = express.Router();
const { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getServices 
} = require("../controllers/user.controller");

router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/services", getServices);

module.exports
