const express = require("express");

const {
  generateBill,
  generateAllBills,
  getAllBills,
  getBillSummary,
  getMemberBills,
  getBillById,
  updateBill,
  addBillPayment,
  deleteBill,
} = require(
  "../controllers/billController"
);

const router =
  express.Router();

/*
  Static routes must come before /:id.
*/

/*
  POST /api/bills/generate
*/
router.post(
  "/generate",
  generateBill
);

/*
  POST /api/bills/generate-all
*/
router.post(
  "/generate-all",
  generateAllBills
);

/*
  GET /api/bills/summary
*/
router.get(
  "/summary",
  getBillSummary
);

/*
  GET /api/bills/member/:memberId
*/
router.get(
  "/member/:memberId",
  getMemberBills
);

/*
  GET /api/bills
*/
router.get(
  "/",
  getAllBills
);

/*
  POST /api/bills/:id/payments
*/
router.post(
  "/:id/payments",
  addBillPayment
);

/*
  GET /api/bills/:id
*/
router.get(
  "/:id",
  getBillById
);

/*
  PUT /api/bills/:id
*/
router.put(
  "/:id",
  updateBill
);

/*
  DELETE /api/bills/:id
*/
router.delete(
  "/:id",
  deleteBill
);

module.exports = router;