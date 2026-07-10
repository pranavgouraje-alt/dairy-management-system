const express = require("express");

const {
  getAllFeedRecords,
  getFeedRecordById,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
} = require("../controllers/feedController");

const router = express.Router();


router.get("/", getAllFeedRecords);


router.get("/:id", getFeedRecordById);


router.post("/", createFeedRecord);


router.put("/:id", updateFeedRecord);


router.delete("/:id", deleteFeedRecord);

module.exports = router;