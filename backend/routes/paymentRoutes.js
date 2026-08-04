const express = require("express");

const {
  createPayment,
  getAllPayments,
  getSummary,
  removePayment,
} = require(
  "../controllers/paymentController"
);

const router =
  express.Router();

/*
  GET /api/payments/summary

  Static route must be placed before
  routes containing parameters.
*/
router.get(
  "/summary",
  getSummary
);

/*
  GET /api/payments
*/
router.get(
  "/",
  getAllPayments
);

/*
  POST /api/payments/bill/:billId
*/
router.post(
  "/bill/:billId",
  createPayment
);

/*
  DELETE /api/payments/:paymentId
*/
router.delete(
  "/:paymentId",
  removePayment
);

module.exports = router;