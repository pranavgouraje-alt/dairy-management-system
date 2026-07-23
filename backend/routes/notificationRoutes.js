const express = require("express");

const {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getActivities,
  clearActivities,
} = require(
  "../controllers/notificationController"
);

const router = express.Router();

/*
  Activity routes must appear before /:id.
*/
router.get(
  "/activities",
  getActivities
);

router.delete(
  "/activities",
  clearActivities
);

router.get("/", getNotifications);

router.post(
  "/",
  createNotification
);

router.patch(
  "/read-all",
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  markNotificationRead
);

router.delete(
  "/:id",
  deleteNotification
);

router.delete(
  "/",
  clearAllNotifications
);

module.exports = router;