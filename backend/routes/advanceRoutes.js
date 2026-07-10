const express = require("express");

const {
  getAllAdvanceRecords,
  getAdvanceRecordById,
  createAdvanceRecord,
  updateAdvanceRecord,
  deductAdvanceAmount,
  deleteAdvanceRecord,
} = require("../controllers/advanceController");

const router = express.Router();

/*
  GET /api/advances
*/
router.get("/", getAllAdvanceRecords);

/*
  GET /api/advances/:id
*/
router.get("/:id", getAdvanceRecordById);

/*
  POST /api/advances
*/
router.post("/", createAdvanceRecord);

/*
  PUT /api/advances/:id
*/
router.put("/:id", updateAdvanceRecord);

/*
  PATCH /api/advances/:id/deduct
*/
router.patch(
  "/:id/deduct",
  deductAdvanceAmount
);

/*
  DELETE /api/advances/:id
*/
router.delete("/:id", deleteAdvanceRecord);

module.exports = router;