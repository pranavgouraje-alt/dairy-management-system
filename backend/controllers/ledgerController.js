const {
  getMemberLedger,
  getLedgerSummary,
  getAllLedger,
} = require("../services/ledgerService");

function sendError(res, error, fallback) {
  console.error(fallback, error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback,
  });
}

async function getMemberLedgerController(req, res) {
  try {
    const data = await getMemberLedger(req.params.memberId, req.query);
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return sendError(res, error, "Unable to load member ledger");
  }
}

async function getLedgerSummaryController(req, res) {
  try {
    const data = await getLedgerSummary(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Unable to load ledger summary");
  }
}

async function getAllLedgerController(req, res) {
  try {
    const data = await getAllLedger(req.query);
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return sendError(res, error, "Unable to load ledger");
  }
}

module.exports = {
  getMemberLedgerController,
  getLedgerSummaryController,
  getAllLedgerController,
};
