const members = require("../data/membersData");
const collections = require("../data/collectionsData");
const feedRecords = require("../data/feedData");
const advanceRecords = require("../data/advanceData");
const billRecords = require("../data/billData");

/*
  Converts a value safely into a number.

  Examples:
  safeNumber("10")  -> 10
  safeNumber(null)  -> 0
  safeNumber("")    -> 0
*/
function safeNumber(value) {
  const number = Number(value);

  return Number.isNaN(number) ? 0 : number;
}

/*
  Rounds amounts to two decimal places.
*/
function roundAmount(value) {
  return Number(safeNumber(value).toFixed(2));
}

/*
  Finds total quantity from collection records.
*/
function getTotalMilk(data) {
  return roundAmount(
    data.reduce(
      (total, item) =>
        total + safeNumber(item.quantity),
      0
    )
  );
}

/*
  Finds total amount from collection records.
*/
function getTotalCollectionAmount(data) {
  return roundAmount(
    data.reduce(
      (total, item) =>
        total + safeNumber(item.amount),
      0
    )
  );
}

/*
  GET /api/reports/dashboard

  Returns the main report summary.
*/
function getDashboardReport(req, res) {
  try {
    const today =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    const todayCollections = collections.filter(
      (item) => item.collectionDate === today
    );

    const cowCollections = todayCollections.filter(
      (item) => item.milkType === "Cow"
    );

    const buffaloCollections =
      todayCollections.filter(
        (item) => item.milkType === "Buffalo"
      );

    const morningCollections =
      todayCollections.filter(
        (item) => item.session === "Morning"
      );

    const eveningCollections =
      todayCollections.filter(
        (item) => item.session === "Evening"
      );

    const pendingFeedAmount = roundAmount(
      feedRecords
        .filter(
          (item) =>
            item.status !== "Paid" &&
            item.status !== "Deducted"
        )
        .reduce(
          (total, item) =>
            total +
            safeNumber(
              item.remainingAmount ??
                item.amount
            ),
          0
        )
    );

    const pendingAdvanceAmount = roundAmount(
      advanceRecords
        .filter(
          (item) =>
            item.status !== "Cleared"
        )
        .reduce(
          (total, item) =>
            total +
            safeNumber(
              item.remainingAmount ??
                item.amount
            ),
          0
        )
    );

    const generatedBillsAmount = roundAmount(
      billRecords.reduce(
        (total, bill) =>
          total +
          safeNumber(bill.netPayable),
        0
      )
    );

    res.status(200).json({
      success: true,

      data: {
        reportDate: today,

        totalMembers: members.length,

        activeMembers: members.filter(
          (member) =>
            member.status !== "Inactive"
        ).length,

        entriesToday: todayCollections.length,

        totalMilk: getTotalMilk(
          todayCollections
        ),

        totalAmount:
          getTotalCollectionAmount(
            todayCollections
          ),

        cowMilk: getTotalMilk(
          cowCollections
        ),

        buffaloMilk: getTotalMilk(
          buffaloCollections
        ),

        morningMilk: getTotalMilk(
          morningCollections
        ),

        eveningMilk: getTotalMilk(
          eveningCollections
        ),

        generatedBills: billRecords.length,

        generatedBillsAmount,

        pendingFeedAmount,

        pendingAdvanceAmount,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate dashboard report",
    });
  }
}

/*
  GET /api/reports/daily?date=2026-07-10

  Returns all collection data for one date.
*/
function getDailyCollectionReport(req, res) {
  try {
    const date =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    const milkType = req.query.milkType;
    const session = req.query.session;

    let dailyCollections = collections.filter(
      (item) =>
        item.collectionDate === date
    );

    if (milkType) {
      dailyCollections =
        dailyCollections.filter(
          (item) =>
            item.milkType === milkType
        );
    }

    if (session) {
      dailyCollections =
        dailyCollections.filter(
          (item) =>
            item.session === session
        );
    }

    const cowCollections =
      dailyCollections.filter(
        (item) => item.milkType === "Cow"
      );

    const buffaloCollections =
      dailyCollections.filter(
        (item) =>
          item.milkType === "Buffalo"
      );

    const morningCollections =
      dailyCollections.filter(
        (item) =>
          item.session === "Morning"
      );

    const eveningCollections =
      dailyCollections.filter(
        (item) =>
          item.session === "Evening"
      );

    res.status(200).json({
      success: true,

      data: {
        reportDate: date,

        filters: {
          milkType: milkType || "All",
          session: session || "All",
        },

        summary: {
          totalEntries:
            dailyCollections.length,

          totalMilk:
            getTotalMilk(
              dailyCollections
            ),

          totalAmount:
            getTotalCollectionAmount(
              dailyCollections
            ),

          cowMilk:
            getTotalMilk(
              cowCollections
            ),

          cowAmount:
            getTotalCollectionAmount(
              cowCollections
            ),

          buffaloMilk:
            getTotalMilk(
              buffaloCollections
            ),

          buffaloAmount:
            getTotalCollectionAmount(
              buffaloCollections
            ),

          morningMilk:
            getTotalMilk(
              morningCollections
            ),

          eveningMilk:
            getTotalMilk(
              eveningCollections
            ),
        },

        records: dailyCollections,
      },
    });
  } catch (error) {
    console.error(
      "Daily report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate daily collection report",
    });
  }
}

/*
  GET /api/reports/member/:memberId

  Optional query parameters:

  fromDate
  toDate
*/
function getMemberReport(req, res) {
  try {
    const memberId = req.params.memberId;

    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    const member = members.find(
      (item) =>
        String(item.memberId) ===
        String(memberId)
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    let memberCollections =
      collections.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );

    if (fromDate) {
      memberCollections =
        memberCollections.filter(
          (item) =>
            item.collectionDate >=
            fromDate
        );
    }

    if (toDate) {
      memberCollections =
        memberCollections.filter(
          (item) =>
            item.collectionDate <=
            toDate
        );
    }

    const memberFeedRecords =
      feedRecords.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );

    const memberAdvanceRecords =
      advanceRecords.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );

    const memberBills =
      billRecords.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );

    const cowCollections =
      memberCollections.filter(
        (item) =>
          item.milkType === "Cow"
      );

    const buffaloCollections =
      memberCollections.filter(
        (item) =>
          item.milkType === "Buffalo"
      );

    const feedDue = roundAmount(
      memberFeedRecords
        .filter(
          (item) =>
            item.status !== "Paid" &&
            item.status !== "Deducted"
        )
        .reduce(
          (total, item) =>
            total +
            safeNumber(
              item.remainingAmount ??
                item.amount
            ),
          0
        )
    );

    const advanceDue = roundAmount(
      memberAdvanceRecords
        .filter(
          (item) =>
            item.status !== "Cleared"
        )
        .reduce(
          (total, item) =>
            total +
            safeNumber(
              item.remainingAmount ??
                item.amount
            ),
          0
        )
    );

    res.status(200).json({
      success: true,

      data: {
        member,

        filters: {
          fromDate: fromDate || "",
          toDate: toDate || "",
        },

        summary: {
          collectionEntries:
            memberCollections.length,

          totalMilk:
            getTotalMilk(
              memberCollections
            ),

          totalMilkAmount:
            getTotalCollectionAmount(
              memberCollections
            ),

          cowMilk:
            getTotalMilk(
              cowCollections
            ),

          cowAmount:
            getTotalCollectionAmount(
              cowCollections
            ),

          buffaloMilk:
            getTotalMilk(
              buffaloCollections
            ),

          buffaloAmount:
            getTotalCollectionAmount(
              buffaloCollections
            ),

          feedDue,

          advanceDue,

          totalBills:
            memberBills.length,

          totalNetPayable:
            roundAmount(
              memberBills.reduce(
                (total, bill) =>
                  total +
                  safeNumber(
                    bill.netPayable
                  ),
                0
              )
            ),
        },

        collections:
          memberCollections,

        feedRecords:
          memberFeedRecords,

        advanceRecords:
          memberAdvanceRecords,

        bills: memberBills,
      },
    });
  } catch (error) {
    console.error(
      "Member report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate member report",
    });
  }
}

/*
  GET /api/reports/feed
*/
function getFeedReport(req, res) {
  try {
    const memberId = req.query.memberId;
    const status = req.query.status;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    let records = [...feedRecords];

    if (memberId) {
      records = records.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );
    }

    if (status) {
      records = records.filter(
        (item) =>
          item.status === status
      );
    }

    if (fromDate) {
      records = records.filter(
        (item) =>
          item.date >= fromDate
      );
    }

    if (toDate) {
      records = records.filter(
        (item) =>
          item.date <= toDate
      );
    }

    const totalAmount = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(item.amount),
        0
      )
    );

    const remainingAmount = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(
            item.remainingAmount ??
              item.amount
          ),
        0
      )
    );

    res.status(200).json({
      success: true,

      data: {
        summary: {
          totalRecords: records.length,

          totalAmount,

          remainingAmount,

          paidRecords:
            records.filter(
              (item) =>
                item.status === "Paid" ||
                item.status === "Deducted"
            ).length,

          unpaidRecords:
            records.filter(
              (item) =>
                item.status !== "Paid" &&
                item.status !== "Deducted"
            ).length,
        },

        records,
      },
    });
  } catch (error) {
    console.error(
      "Feed report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate feed report",
    });
  }
}

/*
  GET /api/reports/advances
*/
function getAdvanceReport(req, res) {
  try {
    const memberId = req.query.memberId;
    const status = req.query.status;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    let records = [...advanceRecords];

    if (memberId) {
      records = records.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );
    }

    if (status) {
      records = records.filter(
        (item) =>
          item.status === status
      );
    }

    if (fromDate) {
      records = records.filter(
        (item) =>
          item.date >= fromDate
      );
    }

    if (toDate) {
      records = records.filter(
        (item) =>
          item.date <= toDate
      );
    }

    const totalAdvance = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(item.amount),
        0
      )
    );

    const totalRemaining =
      roundAmount(
        records.reduce(
          (total, item) =>
            total +
            safeNumber(
              item.remainingAmount ??
                item.amount
            ),
          0
        )
      );

    res.status(200).json({
      success: true,

      data: {
        summary: {
          totalRecords: records.length,

          totalAdvance,

          totalRemaining,

          pendingRecords:
            records.filter(
              (item) =>
                item.status !== "Cleared"
            ).length,

          clearedRecords:
            records.filter(
              (item) =>
                item.status === "Cleared"
            ).length,
        },

        records,
      },
    });
  } catch (error) {
    console.error(
      "Advance report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate advance report",
    });
  }
}

/*
  GET /api/reports/bills
*/
function getBillReport(req, res) {
  try {
    const memberId = req.query.memberId;
    const billMonth = req.query.billMonth;
    const billCycle = req.query.billCycle;

    let records = [...billRecords];

    if (memberId) {
      records = records.filter(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      );
    }

    if (billMonth) {
      records = records.filter(
        (item) =>
          item.billMonth === billMonth
      );
    }

    if (billCycle) {
      records = records.filter(
        (item) =>
          String(item.billCycle) ===
          String(billCycle)
      );
    }

    const totalMilk = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(item.totalMilk),
        0
      )
    );

    const milkAmount = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(item.milkAmount),
        0
      )
    );

    const reserveAmount = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(
            item.reserveAmount
          ),
        0
      )
    );

    const feedDeducted = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(
            item.feedDeducted
          ),
        0
      )
    );

    const advanceDeducted =
      roundAmount(
        records.reduce(
          (total, item) =>
            total +
            safeNumber(
              item.advanceDeducted
            ),
          0
        )
      );

    const netPayable = roundAmount(
      records.reduce(
        (total, item) =>
          total +
          safeNumber(item.netPayable),
        0
      )
    );

    res.status(200).json({
      success: true,

      data: {
        summary: {
          totalBills: records.length,
          totalMilk,
          milkAmount,
          reserveAmount,
          feedDeducted,
          advanceDeducted,
          netPayable,
        },

        records,
      },
    });
  } catch (error) {
    console.error(
      "Bill report error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate billing report",
    });
  }
}

module.exports = {
  getDashboardReport,
  getDailyCollectionReport,
  getMemberReport,
  getFeedReport,
  getAdvanceReport,
  getBillReport,
};