const advanceRecords = require("../data/advanceData");

/*
  GET /api/advances

  Returns all advance records.
*/
function getAllAdvanceRecords(req, res) {
  res.status(200).json({
    success: true,
    count: advanceRecords.length,
    data: advanceRecords,
  });
}

/*
  GET /api/advances/:id

  Returns one advance record.
*/
function getAdvanceRecordById(req, res) {
  const advanceId = req.params.id;

  const record = advanceRecords.find(
    (item) => item.advanceId === advanceId
  );

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Advance record not found",
    });
  }

  res.status(200).json({
    success: true,
    data: record,
  });
}

/*
  POST /api/advances

  Creates a new advance record.
*/
function createAdvanceRecord(req, res) {
  const {
    memberId,
    memberName,
    amount,
    date,
    reason,
    status,
  } = req.body;

  if (
    !memberId ||
    !memberName ||
    amount === "" ||
    amount === undefined ||
    !date
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required advance fields",
    });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Advance amount must be greater than zero",
    });
  }

  const advanceAmount = Number(
    Number(amount).toFixed(2)
  );

  const newAdvanceRecord = {
    advanceId: Date.now().toString(),

    memberId: String(memberId),

    memberName: String(memberName).trim(),

    amount: advanceAmount,

    remainingAmount: advanceAmount,

    date,

    reason: reason
      ? String(reason).trim()
      : "",

    status: status || "Pending",

    createdAt: new Date().toISOString(),

    updatedAt: "",
  };

  advanceRecords.push(newAdvanceRecord);

  res.status(201).json({
    success: true,
    message: "Advance record created successfully",
    data: newAdvanceRecord,
  });
}

/*
  PUT /api/advances/:id

  Updates an existing advance record.
*/
function updateAdvanceRecord(req, res) {
  const advanceId = req.params.id;

  const index = advanceRecords.findIndex(
    (item) => item.advanceId === advanceId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Advance record not found",
    });
  }

  const oldRecord = advanceRecords[index];

  const updatedAmount =
    req.body.amount !== undefined
      ? Number(req.body.amount)
      : Number(oldRecord.amount);

  if (updatedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Advance amount must be greater than zero",
    });
  }

  const updatedStatus =
    req.body.status || oldRecord.status;

  let updatedRemainingAmount;

  if (
    updatedStatus === "Cleared" ||
    updatedStatus === "Paid"
  ) {
    updatedRemainingAmount = 0;
  } else if (
    req.body.remainingAmount !== undefined
  ) {
    updatedRemainingAmount = Number(
      req.body.remainingAmount
    );
  } else if (
    Number(oldRecord.amount) !== updatedAmount
  ) {
    updatedRemainingAmount = updatedAmount;
  } else {
    updatedRemainingAmount = Number(
      oldRecord.remainingAmount
    );
  }

  if (updatedRemainingAmount < 0) {
    return res.status(400).json({
      success: false,
      message: "Remaining amount cannot be negative",
    });
  }

  advanceRecords[index] = {
    ...oldRecord,
    ...req.body,

    advanceId,

    memberId:
      req.body.memberId !== undefined
        ? String(req.body.memberId)
        : oldRecord.memberId,

    memberName:
      req.body.memberName !== undefined
        ? String(req.body.memberName).trim()
        : oldRecord.memberName,

    amount: Number(updatedAmount.toFixed(2)),

    remainingAmount: Number(
      updatedRemainingAmount.toFixed(2)
    ),

    date: req.body.date || oldRecord.date,

    reason:
      req.body.reason !== undefined
        ? String(req.body.reason).trim()
        : oldRecord.reason,

    status: updatedStatus,

    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Advance record updated successfully",
    data: advanceRecords[index],
  });
}

/*
  PATCH /api/advances/:id/deduct

  Deducts an amount from the remaining advance.
*/
function deductAdvanceAmount(req, res) {
  const advanceId = req.params.id;

  const index = advanceRecords.findIndex(
    (item) => item.advanceId === advanceId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Advance record not found",
    });
  }

  const deductionAmount = Number(
    req.body.deductionAmount
  );

  if (
    !deductionAmount ||
    deductionAmount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Deduction amount must be greater than zero",
    });
  }

  const currentRemaining = Number(
    advanceRecords[index].remainingAmount
  );

  const actualDeduction = Math.min(
    deductionAmount,
    currentRemaining
  );

  const newRemaining = Number(
    (
      currentRemaining -
      actualDeduction
    ).toFixed(2)
  );

  advanceRecords[index] = {
    ...advanceRecords[index],

    remainingAmount: newRemaining,

    status:
      newRemaining === 0
        ? "Cleared"
        : "Pending",

    lastDeductedAmount: actualDeduction,

    lastDeductedDate: new Date()
      .toISOString()
      .split("T")[0],

    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Advance deduction completed successfully",
    data: advanceRecords[index],
  });
}

/*
  DELETE /api/advances/:id

  Deletes an advance record.
*/
function deleteAdvanceRecord(req, res) {
  const advanceId = req.params.id;

  const index = advanceRecords.findIndex(
    (item) => item.advanceId === advanceId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Advance record not found",
    });
  }

  const deletedRecord = advanceRecords.splice(
    index,
    1
  );

  res.status(200).json({
    success: true,
    message: "Advance record deleted successfully",
    data: deletedRecord[0],
  });
}

module.exports = {
  getAllAdvanceRecords,
  getAdvanceRecordById,
  createAdvanceRecord,
  updateAdvanceRecord,
  deductAdvanceAmount,
  deleteAdvanceRecord,
};