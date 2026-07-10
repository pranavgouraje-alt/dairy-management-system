const billRecords = require("../data/billData");
const members = require("../data/membersData");
const collections = require("../data/collectionsData");
const feedRecords = require("../data/feedData");
const advanceRecords = require("../data/advanceData");

/*
  Returns billing dates based on month and cycle.

  Cycle 1 → 1 to 10
  Cycle 2 → 11 to 20
  Cycle 3 → 21 to month end
*/
function getBillingDates(month, cycle) {
  if (!month) {
    throw new Error("Billing month is required");
  }

  const [year, monthNumber] = month.split("-");

  let fromDay = "01";
  let toDay = "10";

  if (String(cycle) === "2") {
    fromDay = "11";
    toDay = "20";
  }

  if (String(cycle) === "3") {
    fromDay = "21";

    const lastDay = new Date(
      Number(year),
      Number(monthNumber),
      0
    ).getDate();

    toDay = String(lastDay).padStart(2, "0");
  }

  return {
    fromDate: `${year}-${monthNumber}-${fromDay}`,
    toDate: `${year}-${monthNumber}-${toDay}`,
  };
}

/*
  Returns financial year.

  Example:
  2026-10-01 → 2026-2027
  2026-07-01 → 2025-2026
*/
function getFinancialYear(date) {
  const selectedDate = new Date(date);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  /*
    October = month 10.

    Your yearly cycle starts on 1 October.
  */
  if (month >= 10) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
}

/*
  Returns total milk quantity for a milk type.
*/
function getMilkTotal(data, milkType) {
  return Number(
    data
      .filter(
        (collection) =>
          collection.milkType === milkType
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.quantity || 0),
        0
      )
      .toFixed(2)
  );
}

/*
  Returns total collection amount for a milk type.
*/
function getAmountTotal(data, milkType) {
  return Number(
    data
      .filter(
        (collection) =>
          collection.milkType === milkType
      )
      .reduce(
        (total, collection) =>
          total +
          Number(collection.amount || 0),
        0
      )
      .toFixed(2)
  );
}

/*
  Finds unpaid feed amount for the member.

  Feed records from the selected billing period
  are considered.
*/
function getFeedDue(memberId, fromDate, toDate) {
  return Number(
    feedRecords
      .filter(
        (record) =>
          String(record.memberId) ===
            String(memberId) &&
          record.date >= fromDate &&
          record.date <= toDate &&
          record.status !== "Paid" &&
          record.status !== "Deducted"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.remainingAmount ??
              record.amount ??
              0
          ),
        0
      )
      .toFixed(2)
  );
}

/*
  Finds pending advance amount for a member.
*/
function getAdvanceDue(memberId) {
  return Number(
    advanceRecords
      .filter(
        (record) =>
          String(record.memberId) ===
            String(memberId) &&
          record.status !== "Cleared"
      )
      .reduce(
        (total, record) =>
          total +
          Number(
            record.remainingAmount ??
              record.amount ??
              0
          ),
        0
      )
      .toFixed(2)
  );
}

/*
  Calculates reserve, feed deduction,
  advance deduction and net payable.
*/
function calculateDeductions({
  milkAmount,
  feedDue,
  advanceDue,
}) {
  /*
    Reserve amount = 10% of milk amount
  */
  const reserveAmount = Number(
    (Number(milkAmount) * 0.1).toFixed(2)
  );

  const amountAfterReserve = Number(
    (
      Number(milkAmount) -
      reserveAmount
    ).toFixed(2)
  );

  /*
    Feed deduction cannot exceed available amount.
  */
  const feedDeducted = Number(
    Math.min(
      Number(feedDue),
      Math.max(amountAfterReserve, 0)
    ).toFixed(2)
  );

  const amountAfterFeed = Number(
    (
      amountAfterReserve -
      feedDeducted
    ).toFixed(2)
  );

  /*
    Advance deduction also cannot exceed
    remaining payable amount.
  */
  const advanceDeducted = Number(
    Math.min(
      Number(advanceDue),
      Math.max(amountAfterFeed, 0)
    ).toFixed(2)
  );

  const netPayable = Number(
    Math.max(
      amountAfterFeed - advanceDeducted,
      0
    ).toFixed(2)
  );

  const totalDeduction = Number(
    (
      reserveAmount +
      feedDeducted +
      advanceDeducted
    ).toFixed(2)
  );

  const remainingFeedDue = Number(
    Math.max(
      Number(feedDue) - feedDeducted,
      0
    ).toFixed(2)
  );

  const remainingAdvanceDue = Number(
    Math.max(
      Number(advanceDue) - advanceDeducted,
      0
    ).toFixed(2)
  );

  const remainingDue = Number(
    (
      remainingFeedDue +
      remainingAdvanceDue
    ).toFixed(2)
  );

  return {
    reserveAmount,
    feedDeducted,
    advanceDeducted,
    totalDeduction,
    remainingFeedDue,
    remainingAdvanceDue,
    remainingDue,
    netPayable,
  };
}

/*
  Creates one complete bill object.
*/
function createBillObject({
  memberId,
  billMonth,
  billCycle,
}) {
  const member = members.find(
    (item) =>
      String(item.memberId) ===
      String(memberId)
  );

  if (!member) {
    return {
      error: "Member not found",
    };
  }

  const { fromDate, toDate } =
    getBillingDates(
      billMonth,
      billCycle
    );

  const memberCollections = collections.filter(
    (collection) =>
      String(collection.memberId) ===
        String(memberId) &&
      collection.collectionDate >= fromDate &&
      collection.collectionDate <= toDate
  );

  if (memberCollections.length === 0) {
    return {
      error:
        "No milk collection found for this member and billing cycle",
    };
  }

  const cowMilk = getMilkTotal(
    memberCollections,
    "Cow"
  );

  const buffaloMilk = getMilkTotal(
    memberCollections,
    "Buffalo"
  );

  const cowAmount = getAmountTotal(
    memberCollections,
    "Cow"
  );

  const buffaloAmount = getAmountTotal(
    memberCollections,
    "Buffalo"
  );

  const totalMilk = Number(
    (cowMilk + buffaloMilk).toFixed(2)
  );

  const milkAmount = Number(
    (cowAmount + buffaloAmount).toFixed(2)
  );

  const feedDue = getFeedDue(
    memberId,
    fromDate,
    toDate
  );

  const advanceDue =
    getAdvanceDue(memberId);

  const deductionResult =
    calculateDeductions({
      milkAmount,
      feedDue,
      advanceDue,
    });

  return {
    billId: Date.now().toString(),

    memberId: String(memberId),
    memberName: member.name,

    billMonth,
    billCycle: String(billCycle),

    fromDate,
    toDate,

    totalMilk,
    cowMilk,
    buffaloMilk,

    milkAmount,
    cowAmount,
    buffaloAmount,

    reserveAmount:
      deductionResult.reserveAmount,

    feedDue,
    feedDeducted:
      deductionResult.feedDeducted,
    remainingFeedDue:
      deductionResult.remainingFeedDue,

    advanceDue,
    advanceDeducted:
      deductionResult.advanceDeducted,
    remainingAdvanceDue:
      deductionResult.remainingAdvanceDue,

    totalDeduction:
      deductionResult.totalDeduction,

    remainingDue:
      deductionResult.remainingDue,

    netPayable:
      deductionResult.netPayable,

    financialYear:
      getFinancialYear(fromDate),

    billStatus: "Generated",

    generatedDate: new Date()
      .toISOString()
      .split("T")[0],

    generatedTime:
      new Date().toLocaleTimeString(),

    collections: memberCollections,
  };
}

/*
  GET /api/bills

  Returns all bill records.
*/
function getAllBills(req, res) {
  const {
    memberId,
    billMonth,
    billCycle,
  } = req.query;

  let filteredBills = [...billRecords];

  if (memberId) {
    filteredBills = filteredBills.filter(
      (bill) =>
        String(bill.memberId) ===
        String(memberId)
    );
  }

  if (billMonth) {
    filteredBills = filteredBills.filter(
      (bill) =>
        bill.billMonth === billMonth
    );
  }

  if (billCycle) {
    filteredBills = filteredBills.filter(
      (bill) =>
        String(bill.billCycle) ===
        String(billCycle)
    );
  }

  res.status(200).json({
    success: true,
    count: filteredBills.length,
    data: filteredBills,
  });
}

/*
  GET /api/bills/:id

  Returns one bill.
*/
function getBillById(req, res) {
  const billId = req.params.id;

  const bill = billRecords.find(
    (item) => item.billId === billId
  );

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: "Bill not found",
    });
  }

  res.status(200).json({
    success: true,
    data: bill,
  });
}

/*
  POST /api/bills/generate

  Generates or updates one member bill.
*/
function generateMemberBill(req, res) {
  try {
    const {
      memberId,
      billMonth,
      billCycle,
    } = req.body;

    if (
      !memberId ||
      !billMonth ||
      !billCycle
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member, bill month and cycle are required",
      });
    }

    const bill = createBillObject({
      memberId,
      billMonth,
      billCycle,
    });

    if (bill.error) {
      return res.status(400).json({
        success: false,
        message: bill.error,
      });
    }

    /*
      Find an existing bill for the same
      member, month and cycle.
    */
    const existingIndex =
      billRecords.findIndex(
        (item) =>
          String(item.memberId) ===
            String(memberId) &&
          item.billMonth === billMonth &&
          String(item.billCycle) ===
            String(billCycle)
      );

    if (existingIndex !== -1) {
      bill.billId =
        billRecords[existingIndex].billId;

      billRecords[existingIndex] = bill;

      return res.status(200).json({
        success: true,
        message:
          "Member bill updated successfully",
        data: bill,
      });
    }

    billRecords.push(bill);

    res.status(201).json({
      success: true,
      message:
        "Member bill generated successfully",
      data: bill,
    });
  } catch (error) {
    console.error(
      "Generate member bill error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate member bill",
    });
  }
}

/*
  POST /api/bills/generate-all

  Generates bills for every member having
  collection records in the selected cycle.
*/
function generateAllBills(req, res) {
  try {
    const {
      billMonth,
      billCycle,
    } = req.body;

    if (!billMonth || !billCycle) {
      return res.status(400).json({
        success: false,
        message:
          "Bill month and cycle are required",
      });
    }

    const { fromDate, toDate } =
      getBillingDates(
        billMonth,
        billCycle
      );

    const periodCollections =
      collections.filter(
        (collection) =>
          collection.collectionDate >=
            fromDate &&
          collection.collectionDate <=
            toDate
      );

    const memberIds = [
      ...new Set(
        periodCollections.map(
          (collection) =>
            String(collection.memberId)
        )
      ),
    ];

    if (memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No collections found for this billing cycle",
      });
    }

    const generatedBills = [];

    memberIds.forEach((memberId) => {
      const bill = createBillObject({
        memberId,
        billMonth,
        billCycle,
      });

      if (!bill.error) {
        const existingIndex =
          billRecords.findIndex(
            (item) =>
              String(item.memberId) ===
                String(memberId) &&
              item.billMonth ===
                billMonth &&
              String(item.billCycle) ===
                String(billCycle)
          );

        if (existingIndex !== -1) {
          bill.billId =
            billRecords[
              existingIndex
            ].billId;

          billRecords[existingIndex] =
            bill;
        } else {
          billRecords.push(bill);
        }

        generatedBills.push(bill);
      }
    });

    res.status(200).json({
      success: true,
      message: `${generatedBills.length} bills generated or updated successfully`,
      count: generatedBills.length,
      data: generatedBills,
    });
  } catch (error) {
    console.error(
      "Generate all bills error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate all bills",
    });
  }
}

/*
  DELETE /api/bills/:id

  Deletes a bill record.
*/
function deleteBill(req, res) {
  const billId = req.params.id;

  const index = billRecords.findIndex(
    (item) => item.billId === billId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Bill not found",
    });
  }

  const deletedBill =
    billRecords.splice(index, 1);

  res.status(200).json({
    success: true,
    message:
      "Bill deleted successfully",
    data: deletedBill[0],
  });
}

module.exports = {
  getAllBills,
  getBillById,
  generateMemberBill,
  generateAllBills,
  deleteBill,
};