const {
  getAdvanceRecords,
  getAdvanceById,
  createAdvanceRecord,
  updateAdvanceRecord,
  deductAdvanceAmount,
  deleteAdvanceRecord,
} = require("../services/advanceService");

function sendError(res, error, fallback) {
  console.error(fallback, error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.sqlMessage || error.message || fallback,
  });
}

async function getAllAdvanceRecords(req, res) {
  try {
    const data = await getAdvanceRecords(req.query);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error, "Unable to load advance records");
  }
}

async function getAdvanceRecordById(req, res) {
  try {
    const data = await getAdvanceById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Advance record not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Unable to load advance record");
  }
}

async function createAdvanceRecordController(req, res) {
  try {
    const data = await createAdvanceRecord(req.body);
    return res.status(201).json({ success: true, message: "Advance record created successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to create advance record");
  }
}

async function updateAdvanceRecordController(req, res) {
  try {
    const data = await updateAdvanceRecord(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Advance record updated successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to update advance record");
  }
}

async function deductAdvanceAmountController(req, res) {
  try {
    const data = await deductAdvanceAmount(req.params.id, req.body.deductionAmount);
    return res.status(200).json({ success: true, message: "Advance deduction completed successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to deduct advance");
  }
}

async function deleteAdvanceRecordController(req, res) {
  try {
    const data = await deleteAdvanceRecord(req.params.id);
    return res.status(200).json({ success: true, message: "Advance record deleted successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to delete advance record");
  }
}

module.exports = {
  getAllAdvanceRecords,
  getAdvanceRecordById,
  createAdvanceRecord: createAdvanceRecordController,
  updateAdvanceRecord: updateAdvanceRecordController,
  deductAdvanceAmount: deductAdvanceAmountController,
  deleteAdvanceRecord: deleteAdvanceRecordController,
};
