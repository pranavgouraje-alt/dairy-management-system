const express = require("express");

const {
  getAllBills,
  getBillById,
  generateMemberBill,
  generateAllBills,
  deleteBill,
} = require("../controllers/billController");

const router = express.Router();

/*
  GET /api/bills
*/
router.get("/", getAllBills);

/*
  POST /api/bills/generate

  This must be before /:id.
*/
router.post(
  "/generate",
  generateMemberBill
);

/*
  POST /api/bills/generate-all
*/
router.post(
  "/generate-all",
  generateAllBills
);

/*
  GET /api/bills/:id
*/
router.get("/:id", getBillById);

/*
  DELETE /api/bills/:id
*/
router.delete("/:id", deleteBill);

module.exports = router;