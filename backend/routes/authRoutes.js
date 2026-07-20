const express = require("express");

const {
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUserStatus,
} = require(
  "../controllers/authController"
);

const {
  protect,
  allowRoles,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/login",
  login
);


router.get(
  "/me",
  protect,
  getCurrentUser
);

router.get(
  "/users",
  protect,
  allowRoles("Admin"),
  getAllUsers
);

router.post(
  "/users",
  protect,
  allowRoles("Admin"),
  createUser
);


router.put(
  "/users/:id/status",
  protect,
  allowRoles("Admin"),
  updateUserStatus
);

module.exports = router;