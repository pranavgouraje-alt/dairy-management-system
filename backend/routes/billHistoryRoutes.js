const express = require("express");

const {
  getBillHistory,
  cancelBill,
} = require(
  "../controllers/billHistoryController"
);

const router =
  express.Router();

/*
  GET /api/bill-history
*/
router.get(
  "/",
  getBillHistory
);

/*
  PATCH /api/bill-history/:billId/cancel
*/
router.patch(
  "/:billId/cancel",
  cancelBill
);

module.exports = router;