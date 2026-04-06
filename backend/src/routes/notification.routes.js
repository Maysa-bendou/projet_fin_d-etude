const express = require("express");
const router  = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");

router.get("/:userId",              getNotifications);
router.put("/read-all/:userId",     markAllAsRead);
router.put("/:id/read",             markAsRead);

module.exports = router;