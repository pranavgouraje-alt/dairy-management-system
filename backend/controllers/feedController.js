const {
  getFeedRecords,
  getFeedRecordById,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
} = require("../services/feedService");

function sendError(res, error, fallback) {
  console.error(fallback, error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.sqlMessage || error.message || fallback,
  });
}

async function getAllFeedRecords(req, res) {
  try {
    const data = await getFeedRecords(req.query);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error, "Unable to load feed records");
  }
}

async function getFeedRecordByIdController(req, res) {
  try {
    const data = await getFeedRecordById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Feed record not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Unable to load feed record");
  }
}

async function createFeedRecordController(req, res) {
  try {
    const data = await createFeedRecord(req.body);
    return res.status(201).json({ success: true, message: "Feed record created successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to create feed record");
  }
}

async function updateFeedRecordController(req, res) {
  try {
    const data = await updateFeedRecord(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Feed record updated successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to update feed record");
  }
}

async function deleteFeedRecordController(req, res) {
  try {
    const data = await deleteFeedRecord(req.params.id);
    return res.status(200).json({ success: true, message: "Feed record deleted successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to delete feed record");
  }
}

module.exports = {
  getAllFeedRecords,
  getFeedRecordById: getFeedRecordByIdController,
  createFeedRecord: createFeedRecordController,
  updateFeedRecord: updateFeedRecordController,
  deleteFeedRecord: deleteFeedRecordController,
};
