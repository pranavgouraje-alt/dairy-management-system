const express = require("express");

const {
  getDashboardReport,
  getDailyCollectionReport,
  getMemberReport,
  getFeedReport,
  getAdvanceReport,
  getBillReport,
} = require("../controllers/reportController");

const router = express.Router();

/*
  GET /api/reports/dashboard
*/
router.get(
  "/dashboard",
  getDashboardReport
);

/*
  GET /api/reports/daily
*/
router.get(
  "/daily",
  getDailyCollectionReport
);

/*
  GET /api/reports/feed
*/
router.get(
  "/feed",
  getFeedReport
);

/*
  GET /api/reports/advances
*/
router.get(
  "/advances",
  getAdvanceReport
);

/*
  GET /api/reports/bills
*/
router.get(
  "/bills",
  getBillReport
);

/*
  GET /api/reports/member/:memberId
*/
router.get(
  "/member/:memberId",
  getMemberReport
);

module.exports = router;