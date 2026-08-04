const {
  recordBillPayment,
  getPayments,
  getPaymentSummary,
  deletePayment,
} = require("../services/paymentService");

function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.sqlMessage ||
      error.message ||
      fallbackMessage,
  });
}

async function createPayment(req, res) {
  try {
    const result = await recordBillPayment({
      billId: req.params.billId,
      amount: req.body.amount,
      paymentDate: req.body.paymentDate,
      paymentMethod: req.body.paymentMethod,
      referenceNumber: req.body.referenceNumber,
      note: req.body.note,
      receivedBy:
        req.body.receivedBy ||
        req.user?.username ||
        "System",
    });

    return res.status(201).json({
      success: true,
      message: "Bill payment recorded successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error, "Unable to record bill payment");
  }
}

async function getAllPayments(req, res) {
  try {
    const records = await getPayments(req.query);

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return sendError(res, error, "Unable to load payments");
  }
}

async function getSummary(req, res) {
  try {
    const summary = await getPaymentSummary(req.query);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return sendError(res, error, "Unable to load payment summary");
  }
}

async function removePayment(req, res) {
  try {
    const result = await deletePayment(req.params.paymentId);

    return res.status(200).json({
      success: true,
      message: "Payment deleted and bill balance restored",
      data: result,
    });
  } catch (error) {
    return sendError(res, error, "Unable to delete payment");
  }
}

module.exports = {
  createPayment,
  getAllPayments,
  getSummary,
  removePayment,
};
