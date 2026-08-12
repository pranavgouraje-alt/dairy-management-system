const express = require("express");

const {
  getMemberLedgerController,
  getLedgerSummaryController,
  getAllLedgerController,
} = require("../controllers/ledgerController");

const router = express.Router();

router.get("/summary", getLedgerSummaryController);
router.get("/member/:memberId", getMemberLedgerController);
router.get("/", getAllLedgerController);

module.exports = router;
