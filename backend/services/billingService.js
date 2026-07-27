const {
  pool,
} = require("../config/db");

const {
  calculateMilkSummary,
  calculateBillTotals,
  getBillingPeriod,
  generateBillNumber,
  roundAmount,
} = require(
  "../utils/billCalculator"
);

/*
  Checks whether a table exists in the
  currently connected database.
*/
async function tableExists(
  connection,
  tableName
) {
  const [rows] =
    await connection.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = ?
      `,
      [tableName]
    );

  return Number(
    rows[0].total
  ) > 0;
}

/*
  Loads one member.
*/
async function getMember(
  connection,
  memberId
) {
  const [rows] =
    await connection.execute(
      `
        SELECT
          member_id,
          name,
          mobile,
          village,
          status
        FROM members
        WHERE member_id = ?
        LIMIT 1
      `,
      [memberId]
    );

  return rows[0] || null;
}

/*
  Loads active members.
*/
async function getActiveMembers(
  connection
) {
  const [rows] =
    await connection.execute(
      `
        SELECT
          member_id,
          name,
          mobile,
          village,
          status
        FROM members
        WHERE status = 'Active'
        ORDER BY
          CAST(member_id AS UNSIGNED),
          member_id
      `
    );

  return rows;
}

/*
  Loads milk collections for one member
  and one billing period.
*/
async function getMemberCollections(
  connection,
  memberId,
  fromDate,
  toDate
) {
  const [rows] =
    await connection.execute(
      `
        SELECT
          collection_id,
          member_id,

          DATE_FORMAT(
            collection_date,
            '%Y-%m-%d'
          ) AS collection_date,

          TIME_FORMAT(
            collection_time,
            '%H:%i:%s'
          ) AS collection_time,

          milk_type,
          session,
          quantity,
          fat,
          snf,
          rate,
          amount

        FROM collections

        WHERE member_id = ?
          AND collection_date
              BETWEEN ? AND ?

        ORDER BY
          collection_date ASC,
          FIELD(
            session,
            'Morning',
            'Evening'
          ),
          collection_time ASC,
          collection_id ASC
      `,
      [
        memberId,
        fromDate,
        toDate,
      ]
    );

  return rows;
}

/*
  Loads the total pending feed balance.

  Supports the Day 61 feed_records design.

  When the table has not yet been migrated
  to MySQL, it returns zero.
*/
async function getPendingFeedDue(
  connection,
  memberId
) {
  const exists =
    await tableExists(
      connection,
      "feed_records"
    );

  if (!exists) {
    return 0;
  }

  try {
    const [rows] =
      await connection.execute(
        `
          SELECT
            COALESCE(
              SUM(remaining_amount),
              0
            ) AS feed_due
          FROM feed_records
          WHERE member_id = ?
            AND status NOT IN (
              'Paid',
              'Deducted'
            )
        `,
        [memberId]
      );

    return roundAmount(
      rows[0].feed_due
    );
  } catch (error) {
    console.warn(
      "Feed deduction query skipped:",
      error.message
    );

    return 0;
  }
}

/*
  Loads pending advance balance.

  Supports an advances table containing
  remaining_amount.

  When the table is unavailable, returns 0.
*/
async function getPendingAdvanceDue(
  connection,
  memberId
) {
  const exists =
    await tableExists(
      connection,
      "advances"
    );

  if (!exists) {
    return 0;
  }

  try {
    const [rows] =
      await connection.execute(
        `
          SELECT
            COALESCE(
              SUM(remaining_amount),
              0
            ) AS advance_due
          FROM advances
          WHERE member_id = ?
            AND status NOT IN (
              'Paid',
              'Cleared',
              'Deducted'
            )
        `,
        [memberId]
      );

    return roundAmount(
      rows[0].advance_due
    );
  } catch (error) {
    console.warn(
      "Advance deduction query skipped:",
      error.message
    );

    return 0;
  }
}

/*
  Loads an existing bill for the member,
  month and cycle.
*/
async function getExistingBill(
  connection,
  memberId,
  billMonth,
  billCycle
) {
  const [rows] =
    await connection.execute(
      `
        SELECT *
        FROM bills
        WHERE member_id = ?
          AND bill_month = ?
          AND bill_cycle = ?
        LIMIT 1
      `,
      [
        memberId,
        billMonth,
        billCycle,
      ]
    );

  return rows[0] || null;
}

/*
  Inserts all included collection rows
  into bill_items.
*/
async function replaceBillItems(
  connection,
  billId,
  collections
) {
  await connection.execute(
    `
      DELETE FROM bill_items
      WHERE bill_id = ?
    `,
    [billId]
  );

  for (
    const collection
    of collections
  ) {
    await connection.execute(
      `
        INSERT INTO bill_items (
          bill_id,
          collection_id,
          collection_date,
          collection_time,
          milk_type,
          session,
          quantity,
          fat,
          snf,
          rate,
          amount
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        billId,
        collection.collection_id,
        collection.collection_date,
        collection.collection_time,
        collection.milk_type,
        collection.session,
        collection.quantity,
        collection.fat,
        collection.snf,
        collection.rate,
        collection.amount,
      ]
    );
  }
}

/*
  Saves deduction summary rows.
*/
async function replaceBillDeductions(
  connection,
  billId,
  calculation
) {
  await connection.execute(
    `
      DELETE FROM bill_deductions
      WHERE bill_id = ?
    `,
    [billId]
  );

  const deductionRows = [
    {
      type: "Reserve",

      description:
        `${calculation.reservePercent}% reserve amount`,

      dueAmount:
        calculation.reserveAmount,

      deductedAmount:
        calculation.reserveAmount,

      remainingAmount: 0,
    },

    {
      type: "Feed",

      description:
        "Pending cattle feed deduction",

      dueAmount:
        calculation.feedDue,

      deductedAmount:
        calculation.feedDeducted,

      remainingAmount:
        calculation.remainingFeedDue,
    },

    {
      type: "Advance",

      description:
        "Pending advance deduction",

      dueAmount:
        calculation.advanceDue,

      deductedAmount:
        calculation.advanceDeducted,

      remainingAmount:
        calculation.remainingAdvanceDue,
    },

    {
      type: "Other",

      description:
        "Other manual deduction",

      dueAmount:
        calculation.otherDeduction,

      deductedAmount:
        calculation.otherDeduction,

      remainingAmount: 0,
    },
  ];

  for (
    const deduction
    of deductionRows
  ) {
    if (
      Number(
        deduction.dueAmount
      ) <= 0 &&
      Number(
        deduction.deductedAmount
      ) <= 0
    ) {
      continue;
    }

    await connection.execute(
      `
        INSERT INTO bill_deductions (
          bill_id,
          deduction_type,
          source_record_id,
          description,
          due_amount,
          deducted_amount,
          remaining_amount
        )
        VALUES (
          ?,
          ?,
          NULL,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        billId,
        deduction.type,
        deduction.description,
        deduction.dueAmount,
        deduction.deductedAmount,
        deduction.remainingAmount,
      ]
    );
  }
}

/*
  Creates or updates one member bill.

  Existing payments are preserved.
*/
async function generateMemberBill({
  connection,
  memberId,
  billMonth,
  billCycle,
  reservePercent = 10,
  otherDeduction = 0,
  generatedBy = "System",
}) {
  const period = getBillingPeriod(
    billMonth,
    billCycle
  );

  const member =
    await getMember(
      connection,
      memberId
    );

  if (!member) {
    throw new Error(
      `Member ${memberId} not found`
    );
  }

  const collections =
    await getMemberCollections(
      connection,
      memberId,
      period.fromDate,
      period.toDate
    );

  if (collections.length === 0) {
    return {
      generated: false,
      skipped: true,
      reason:
        "No milk collections found",
      member,
      period,
    };
  }

  const milkSummary =
    calculateMilkSummary(
      collections
    );

  const feedDue =
    await getPendingFeedDue(
      connection,
      memberId
    );

  const advanceDue =
    await getPendingAdvanceDue(
      connection,
      memberId
    );

  const billCalculation =
    calculateBillTotals({
      milkAmount:
        milkSummary.milkAmount,

      feedDue,

      advanceDue,

      otherDeduction,

      reservePercent,
    });

  const existingBill =
    await getExistingBill(
      connection,
      memberId,
      billMonth,
      billCycle
    );

  let billId;
  let billNumber;
  let paidAmount = 0;

  if (existingBill) {
    billId =
      existingBill.bill_id;

    billNumber =
      existingBill.bill_number;

    paidAmount = roundAmount(
      existingBill.paid_amount
    );

    const balanceAmount =
      roundAmount(
        Math.max(
          0,
          billCalculation.netPayable -
            paidAmount
        )
      );

    const status =
      balanceAmount <= 0
        ? "Paid"
        : paidAmount > 0
          ? "Partially Paid"
          : "Pending";

    await connection.execute(
      `
        UPDATE bills
        SET
          period_from = ?,
          period_to = ?,

          cow_milk = ?,
          buffalo_milk = ?,
          total_milk = ?,

          cow_amount = ?,
          buffalo_amount = ?,
          milk_amount = ?,

          average_fat = ?,
          average_snf = ?,

          feed_due = ?,
          feed_deducted = ?,

          advance_due = ?,
          advance_deducted = ?,

          other_deduction = ?,

          reserve_percent = ?,
          reserve_amount = ?,

          total_deduction = ?,
          net_payable = ?,

          balance_amount = ?,
          status = ?,

          generated_by = ?,
          generated_at = NOW()

        WHERE bill_id = ?
      `,
      [
        period.fromDate,
        period.toDate,

        milkSummary.cowMilk,
        milkSummary.buffaloMilk,
        milkSummary.totalMilk,

        milkSummary.cowAmount,
        milkSummary.buffaloAmount,
        milkSummary.milkAmount,

        milkSummary.averageFat,
        milkSummary.averageSnf,

        billCalculation.feedDue,
        billCalculation.feedDeducted,

        billCalculation.advanceDue,
        billCalculation.advanceDeducted,

        billCalculation.otherDeduction,

        billCalculation.reservePercent,
        billCalculation.reserveAmount,

        billCalculation.totalDeduction,
        billCalculation.netPayable,

        balanceAmount,
        status,

        generatedBy,
        billId,
      ]
    );
  } else {
    billNumber =
      generateBillNumber({
        billMonth,
        billCycle,
        memberId,
      });

    const [insertResult] =
      await connection.execute(
        `
          INSERT INTO bills (
            bill_number,
            member_id,
            bill_month,
            bill_cycle,
            period_from,
            period_to,

            cow_milk,
            buffalo_milk,
            total_milk,

            cow_amount,
            buffalo_amount,
            milk_amount,

            average_fat,
            average_snf,

            feed_due,
            feed_deducted,

            advance_due,
            advance_deducted,

            other_deduction,

            reserve_percent,
            reserve_amount,

            total_deduction,
            net_payable,

            paid_amount,
            balance_amount,

            status,
            generated_by
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,

            ?,
            ?,
            ?,

            ?,
            ?,
            ?,

            ?,
            ?,

            ?,
            ?,

            ?,
            ?,

            ?,

            ?,
            ?,

            ?,
            ?,

            0,
            ?,

            ?,
            ?
          )
        `,
        [
          billNumber,
          memberId,
          billMonth,
          billCycle,
          period.fromDate,
          period.toDate,

          milkSummary.cowMilk,
          milkSummary.buffaloMilk,
          milkSummary.totalMilk,

          milkSummary.cowAmount,
          milkSummary.buffaloAmount,
          milkSummary.milkAmount,

          milkSummary.averageFat,
          milkSummary.averageSnf,

          billCalculation.feedDue,
          billCalculation.feedDeducted,

          billCalculation.advanceDue,
          billCalculation.advanceDeducted,

          billCalculation.otherDeduction,

          billCalculation.reservePercent,
          billCalculation.reserveAmount,

          billCalculation.totalDeduction,
          billCalculation.netPayable,

          billCalculation.balanceAmount,

          billCalculation.status,
          generatedBy,
        ]
      );

    billId =
      insertResult.insertId;
  }

  await replaceBillItems(
    connection,
    billId,
    collections
  );

  await replaceBillDeductions(
    connection,
    billId,
    billCalculation
  );

  return {
    generated: true,
    skipped: false,

    billId:
      String(billId),

    billNumber,

    member,

    period,

    collectionCount:
      collections.length,

    milkSummary,

    calculation: {
      ...billCalculation,
      paidAmount,
    },
  };
}

/*
  Generates bills for all active members.
*/
async function generateAllMemberBills({
  billMonth,
  billCycle,
  reservePercent = 10,
  otherDeduction = 0,
  generatedBy = "System",
}) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const members =
      await getActiveMembers(
        connection
      );

    const generatedBills = [];
    const skippedMembers = [];
    const failedMembers = [];

    for (
      const member
      of members
    ) {
      try {
        const result =
          await generateMemberBill({
            connection,

            memberId:
              member.member_id,

            billMonth,

            billCycle,

            reservePercent,

            otherDeduction,

            generatedBy,
          });

        if (result.skipped) {
          skippedMembers.push({
            memberId:
              member.member_id,

            memberName:
              member.name,

            reason:
              result.reason,
          });
        } else {
          generatedBills.push(
            result
          );
        }
      } catch (error) {
        failedMembers.push({
          memberId:
            member.member_id,

          memberName:
            member.name,

          reason:
            error.message,
        });
      }
    }

    await connection.commit();

    return {
      success: true,

      totalMembers:
        members.length,

      generatedCount:
        generatedBills.length,

      skippedCount:
        skippedMembers.length,

      failedCount:
        failedMembers.length,

      generatedBills,
      skippedMembers,
      failedMembers,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/*
  Generates one bill inside its own transaction.
*/
async function generateSingleMemberBill(
  options
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result =
      await generateMemberBill({
        connection,
        ...options,
      });

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  tableExists,
  getMember,
  getActiveMembers,
  getMemberCollections,
  getPendingFeedDue,
  getPendingAdvanceDue,
  getExistingBill,
  generateMemberBill,
  generateSingleMemberBill,
  generateAllMemberBills,
};