const express = require("express");
const router = express.Router();
// const { authenticate } = require("../middleware/auth");

const departmentController = require("../controllers/department.controller");

// router.use(authenticate);


router.get("/", departmentController.getAllDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.post("/", departmentController.createDepartment);
router.put("/:id", departmentController.updateDepartment);
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
