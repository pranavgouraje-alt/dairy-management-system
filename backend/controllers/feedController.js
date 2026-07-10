const feedRecords = require("../data/feedData");

/*
  GET /api/feed

  Returns every feed record.
*/
function getAllFeedRecords(req, res) {
  res.status(200).json({
    success: true,
    count: feedRecords.length,
    data: feedRecords,
  });
}

/*
  GET /api/feed/:id

  Returns one feed record using feedId.
*/
function getFeedRecordById(req, res) {
  const feedId = req.params.id;

  const record = feedRecords.find(
    (item) => item.feedId === feedId
  );

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Feed record not found",
    });
  }

  res.status(200).json({
    success: true,
    data: record,
  });
}

/*
  POST /api/feed

  Creates a new feed record.
*/
function createFeedRecord(req, res) {
  const {
    memberId,
    memberName,
    feedType,
    quantity,
    rate,
    amount,
    date,
    status,
  } = req.body;

  if (
    !memberId ||
    !memberName ||
    !feedType ||
    quantity === "" ||
    quantity === undefined ||
    rate === "" ||
    rate === undefined ||
    !date
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required feed fields",
    });
  }

  if (Number(quantity) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than zero",
    });
  }

  if (Number(rate) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Rate must be greater than zero",
    });
  }

  const calculatedAmount =
    Number(quantity) * Number(rate);

  const newFeedRecord = {
    feedId: Date.now().toString(),

    memberId: String(memberId),
    memberName: String(memberName).trim(),
    feedType: String(feedType).trim(),

    quantity: Number(quantity),
    rate: Number(rate),

    amount: Number(
      (
        amount !== undefined && amount !== ""
          ? Number(amount)
          : calculatedAmount
      ).toFixed(2)
    ),

    remainingAmount: Number(
      (
        amount !== undefined && amount !== ""
          ? Number(amount)
          : calculatedAmount
      ).toFixed(2)
    ),

    date,

    status: status || "Unpaid",

    createdAt: new Date().toISOString(),
    updatedAt: "",
  };

  feedRecords.push(newFeedRecord);

  res.status(201).json({
    success: true,
    message: "Feed record created successfully",
    data: newFeedRecord,
  });
}

/*
  PUT /api/feed/:id

  Updates an existing feed record.
*/
function updateFeedRecord(req, res) {
  const feedId = req.params.id;

  const index = feedRecords.findIndex(
    (item) => item.feedId === feedId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Feed record not found",
    });
  }

  const oldRecord = feedRecords[index];

  const updatedQuantity =
    req.body.quantity !== undefined
      ? Number(req.body.quantity)
      : Number(oldRecord.quantity);

  const updatedRate =
    req.body.rate !== undefined
      ? Number(req.body.rate)
      : Number(oldRecord.rate);

  if (updatedQuantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than zero",
    });
  }

  if (updatedRate <= 0) {
    return res.status(400).json({
      success: false,
      message: "Rate must be greater than zero",
    });
  }

  const updatedAmount = Number(
    (updatedQuantity * updatedRate).toFixed(2)
  );

  const updatedStatus =
    req.body.status || oldRecord.status;

  feedRecords[index] = {
    ...oldRecord,
    ...req.body,

    feedId,

    memberId:
      req.body.memberId !== undefined
        ? String(req.body.memberId)
        : oldRecord.memberId,

    memberName:
      req.body.memberName !== undefined
        ? String(req.body.memberName).trim()
        : oldRecord.memberName,

    feedType:
      req.body.feedType !== undefined
        ? String(req.body.feedType).trim()
        : oldRecord.feedType,

    quantity: updatedQuantity,
    rate: updatedRate,
    amount: updatedAmount,

    remainingAmount:
      updatedStatus === "Paid" ||
      updatedStatus === "Deducted"
        ? 0
        : updatedAmount,

    date: req.body.date || oldRecord.date,
    status: updatedStatus,

    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Feed record updated successfully",
    data: feedRecords[index],
  });
}

/*
  DELETE /api/feed/:id

  Deletes a feed record.
*/
function deleteFeedRecord(req, res) {
  const feedId = req.params.id;

  const index = feedRecords.findIndex(
    (item) => item.feedId === feedId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Feed record not found",
    });
  }

  const deletedRecord = feedRecords.splice(index, 1);

  res.status(200).json({
    success: true,
    message: "Feed record deleted successfully",
    data: deletedRecord[0],
  });
}

module.exports = {
  getAllFeedRecords,
  getFeedRecordById,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
};