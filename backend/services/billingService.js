const {
  pool,
} = require("../config/db");

const {
  postLedgerEntry,
  reverseReferenceEntries,
} = require("./ledgerService");

const {
  calculateMilkSummary,
  calculateBillTotals,
  getBillingPeriod,
  generateBillNumber,
  roundAmount,
} = require(
  "../utils/billCalculator"
);

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

async function getMemberCollections(
  connection,
  memberId,
  fromDate,
  toDate,
  lockRows = false
) {
  const lockClause = lockRows
    ? "FOR UPDATE"
    : "";

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

        ${lockClause}
      `,
      [
        memberId,
        fromDate,
        toDate,
      ]
    );

  return rows;
}

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


async function getPendingFeedDue(connection, memberId, billId = null, lockRows = false) {
  const lockClause = lockRows ? " FOR UPDATE" : "";
  let query = `
    SELECT COALESCE(SUM(f.remaining_amount), 0) AS feed_due
    FROM feed_records f
    WHERE f.member_id = ?
      AND f.remaining_amount > 0
  `;
  const values = [memberId];

  // When previewing an already-generated bill, include the amount that
  // was previously allocated to that bill so the preview represents the
  // same financial position as the saved bill.
  if (billId) {
    query = `
      SELECT COALESCE(
        SUM(f.remaining_amount) + COALESCE((
          SELECT SUM(a.deducted_amount)
          FROM bill_deduction_allocations a
          WHERE a.bill_id = ?
            AND a.source_type = 'Feed'
            AND a.source_record_id = CAST(f.feed_id AS CHAR)
        ), 0),
        0
      ) AS feed_due
      FROM feed_records f
      WHERE f.member_id = ?
    `;
    values.unshift(billId);
  }

  const [rows] = await connection.execute(query + lockClause, values);
  return roundAmount(rows[0]?.feed_due);
}

async function getPendingAdvanceDue(connection, memberId, billId = null, lockRows = false) {
  const lockClause = lockRows ? " FOR UPDATE" : "";
  let query = `
    SELECT COALESCE(SUM(a.remaining_amount), 0) AS advance_due
    FROM advances a
    WHERE a.member_id = ?
      AND a.remaining_amount > 0
  `;
  const values = [memberId];

  if (billId) {
    query = `
      SELECT COALESCE(
        SUM(a.remaining_amount) + COALESCE((
          SELECT SUM(x.deducted_amount)
          FROM bill_deduction_allocations x
          WHERE x.bill_id = ?
            AND x.source_type = 'Advance'
            AND x.source_record_id = CAST(a.advance_id AS CHAR)
        ), 0),
        0
      ) AS advance_due
      FROM advances a
      WHERE a.member_id = ?
    `;
    values.unshift(billId);
  }

  const [rows] = await connection.execute(query + lockClause, values);
  return roundAmount(rows[0]?.advance_due);
}

async function restoreBillDeductionAllocations(connection, billId) {
  const [allocations] = await connection.execute(
    `
      SELECT allocation_id, source_type, source_record_id, deducted_amount
      FROM bill_deduction_allocations
      WHERE bill_id = ?
      ORDER BY allocation_id DESC
      FOR UPDATE
    `,
    [billId]
  );

  for (const allocation of allocations) {
    const table = allocation.source_type === "Feed" ? "feed_records" : "advances";
    const idColumn = allocation.source_type === "Feed" ? "feed_id" : "advance_id";

    await connection.execute(
      `
        UPDATE ${table}
        SET
          remaining_amount = LEAST(amount, remaining_amount + ?),
          status = CASE
            WHEN remaining_amount + ? >= amount THEN ${allocation.source_type === "Feed" ? "'Unpaid'" : "'Pending'"}
            ELSE 'Partially Deducted'
          END,
          last_deducted_amount = 0,
          last_deducted_date = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE ${idColumn} = ?
      `,
      [allocation.deducted_amount, allocation.deducted_amount, allocation.source_record_id]
    );
  }

  await connection.execute(
    `DELETE FROM bill_deduction_allocations WHERE bill_id = ?`,
    [billId]
  );
}

async function allocateFeedDeduction(connection, billId, memberId, amount) {
  let remainingToAllocate = roundAmount(amount);
  if (remainingToAllocate <= 0) return;

  const [rows] = await connection.execute(
    `
      SELECT feed_id, amount, remaining_amount
      FROM feed_records
      WHERE member_id = ?
        AND remaining_amount > 0
      ORDER BY date ASC, feed_id ASC
      FOR UPDATE
    `,
    [memberId]
  );

  for (const row of rows) {
    if (remainingToAllocate <= 0) break;

    const currentRemaining = roundAmount(row.remaining_amount);
    const deducted = roundAmount(Math.min(currentRemaining, remainingToAllocate));
    if (deducted <= 0) continue;

    const newRemaining = roundAmount(currentRemaining - deducted);
    const status = newRemaining === 0 ? "Deducted" : "Partially Deducted";

    await connection.execute(
      `
        UPDATE feed_records
        SET
          remaining_amount = ?,
          status = ?,
          last_deducted_amount = ?,
          last_deducted_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
        WHERE feed_id = ?
      `,
      [newRemaining, status, deducted, row.feed_id]
    );

    await connection.execute(
      `
        INSERT INTO bill_deduction_allocations
          (bill_id, source_type, source_record_id, due_amount, deducted_amount)
        VALUES (?, 'Feed', ?, ?, ?)
      `,
      [billId, String(row.feed_id), currentRemaining, deducted]
    );

    remainingToAllocate = roundAmount(remainingToAllocate - deducted);
  }

  if (remainingToAllocate > 0.01) {
    throw new Error("Unable to allocate the complete feed deduction");
  }
}

async function allocateAdvanceDeduction(connection, billId, memberId, amount) {
  let remainingToAllocate = roundAmount(amount);
  if (remainingToAllocate <= 0) return;

  const [rows] = await connection.execute(
    `
      SELECT advance_id, amount, remaining_amount
      FROM advances
      WHERE member_id = ?
        AND remaining_amount > 0
      ORDER BY date ASC, advance_id ASC
      FOR UPDATE
    `,
    [memberId]
  );

  for (const row of rows) {
    if (remainingToAllocate <= 0) break;

    const currentRemaining = roundAmount(row.remaining_amount);
    const deducted = roundAmount(Math.min(currentRemaining, remainingToAllocate));
    if (deducted <= 0) continue;

    const newRemaining = roundAmount(currentRemaining - deducted);
    const status = newRemaining === 0 ? "Cleared" : "Partially Deducted";

    await connection.execute(
      `
        UPDATE advances
        SET
          remaining_amount = ?,
          status = ?,
          last_deducted_amount = ?,
          last_deducted_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
        WHERE advance_id = ?
      `,
      [newRemaining, status, deducted, row.advance_id]
    );

    await connection.execute(
      `
        INSERT INTO bill_deduction_allocations
          (bill_id, source_type, source_record_id, due_amount, deducted_amount)
        VALUES (?, 'Advance', ?, ?, ?)
      `,
      [billId, String(row.advance_id), currentRemaining, deducted]
    );

    remainingToAllocate = roundAmount(remainingToAllocate - deducted);
  }

  if (remainingToAllocate > 0.01) {
    throw new Error("Unable to allocate the complete advance deduction");
  }
}

function mapCollection(collection) {
  return {
    collectionId:
      String(collection.collection_id),

    memberId:
      String(collection.member_id),

    collectionDate:
      collection.collection_date,

    collectionTime:
      collection.collection_time,

    milkType:
      collection.milk_type,

    session:
      collection.session,

    quantity:
      Number(collection.quantity),

    fat:
      Number(collection.fat),

    snf:
      Number(collection.snf),

    rate:
      Number(collection.rate),

    amount:
      Number(collection.amount),
  };
}

function createFlatBillResult({
  billId = null,
  billNumber = null,
  member,
  period,
  collections,
  milkSummary,
  calculation,
  paidAmount = 0,
  status,
  generated = false,
  existing = false,
}) {
  const balanceAmount = roundAmount(
    Math.max(
      calculation.netPayable -
        paidAmount,
      0
    )
  );

  return {
    generated,
    existing,

    billId:
      billId === null
        ? null
        : String(billId),

    billNumber,

    memberId:
      String(member.member_id),

    memberName:
      member.name,

    mobile:
      member.mobile || "",

    village:
      member.village || "",

    billMonth:
      period.billMonth,

    billCycle:
      period.billCycle,

    periodFrom:
      period.fromDate,

    periodTo:
      period.toDate,

    collectionCount:
      collections.length,

    collections:
      collections.map(
        mapCollection
      ),

    ...milkSummary,
    ...calculation,

    paidAmount:
      roundAmount(paidAmount),

    balanceAmount,

    remainingDue:
      roundAmount(
        calculation.remainingFeedDue +
          calculation.remainingAdvanceDue
      ),

    status:
      status ||
      (
        balanceAmount <= 0
          ? "Paid"
          : paidAmount > 0
            ? "Partially Paid"
            : "Pending"
      ),
  };
}

async function calculateMemberBill({
  connection,
  memberId,
  billMonth,
  billCycle,
  reservePercent = 10,
  feedDue = 0,
  advanceDue = 0,
  otherDeduction = 0,
  lockRows = false,
}) {
  const period = getBillingPeriod(
    billMonth,
    billCycle
  );

  const member = await getMember(
    connection,
    memberId
  );

  if (!member) {
    const error = new Error(
      `Member ${memberId} not found`
    );

    error.statusCode = 404;
    throw error;
  }

  const collections =
    await getMemberCollections(
      connection,
      memberId,
      period.fromDate,
      period.toDate,
      lockRows
    );

  if (collections.length === 0) {
    return {
      skipped: true,
      reason:
        "No milk collections found",
      member,
      period,
      collections: [],
    };
  }

  const milkSummary =
    calculateMilkSummary(
      collections
    );

  const existingBill = await getExistingBill(
    connection,
    memberId,
    billMonth,
    billCycle
  );

  const resolvedFeedDue = await getPendingFeedDue(
    connection,
    memberId,
    existingBill?.bill_id || null,
    lockRows
  );

  const resolvedAdvanceDue = await getPendingAdvanceDue(
    connection,
    memberId,
    existingBill?.bill_id || null,
    lockRows
  );

  const calculation =
    calculateBillTotals({
      milkAmount:
        milkSummary.milkAmount,

      feedDue: resolvedFeedDue,
      advanceDue: resolvedAdvanceDue,
      otherDeduction,
      reservePercent,
    });

  return {
    skipped: false,
    member,
    period,
    collections,
    milkSummary,
    calculation,
  };
}

async function previewMemberBill(
  options
) {
  const connection =
    await pool.getConnection();

  try {
    const calculated =
      await calculateMemberBill({
        connection,
        ...options,
        lockRows: false,
      });

    if (calculated.skipped) {
      return {
        generated: false,
        skipped: true,
        reason:
          calculated.reason,
        member: calculated.member,
        period: calculated.period,
      };
    }

    const existingBill =
      await getExistingBill(
        connection,
        options.memberId,
        options.billMonth,
        options.billCycle
      );

    return createFlatBillResult({
      member:
        calculated.member,

      period:
        calculated.period,

      collections:
        calculated.collections,

      milkSummary:
        calculated.milkSummary,

      calculation:
        calculated.calculation,

      billId:
        existingBill?.bill_id ||
        null,

      billNumber:
        existingBill?.bill_number ||
        null,

      paidAmount:
        roundAmount(
          existingBill?.paid_amount
        ),

      status:
        existingBill?.status,

      generated: false,
      existing:
        Boolean(existingBill),
    });
  } finally {
    connection.release();
  }
}

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

  for (const collection of collections) {
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
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
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

  const rows = [
    {
      type: "Feed",
      description:
        "Cattle feed deduction",
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
        "Advance recovery",
      dueAmount:
        calculation.advanceDue,
      deductedAmount:
        calculation.advanceDeducted,
      remainingAmount:
        calculation
          .remainingAdvanceDue,
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
  ];

  for (const row of rows) {
    if (
      Number(row.dueAmount) <= 0 &&
      Number(
        row.deductedAmount
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
          ?, ?, NULL, ?, ?, ?, ?
        )
      `,
      [
        billId,
        row.type,
        row.description,
        row.dueAmount,
        row.deductedAmount,
        row.remainingAmount,
      ]
    );
  }
}

async function saveCalculatedBill({
  connection,
  options,
  calculated,
}) {
  const existingBill =
    await getExistingBill(
      connection,
      options.memberId,
      options.billMonth,
      options.billCycle
    );

  let billId;
  let billNumber;
  let paidAmount = 0;

  if (existingBill) {
    billId =
      existingBill.bill_id;

    await reverseReferenceEntries(
      connection,
      "BILL",
      billId,
      options.generatedBy || "System"
    );

    billNumber =
      existingBill.bill_number;

    paidAmount = roundAmount(
      existingBill.paid_amount
    );

    const balanceAmount =
      roundAmount(
        Math.max(
          calculated.calculation
            .netPayable -
            paidAmount,
          0
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
        calculated.period.fromDate,
        calculated.period.toDate,

        calculated.milkSummary.cowMilk,
        calculated.milkSummary
          .buffaloMilk,
        calculated.milkSummary
          .totalMilk,

        calculated.milkSummary.cowAmount,
        calculated.milkSummary
          .buffaloAmount,
        calculated.milkSummary
          .milkAmount,

        calculated.milkSummary
          .averageFat,
        calculated.milkSummary
          .averageSnf,

        calculated.calculation.feedDue,
        calculated.calculation
          .feedDeducted,

        calculated.calculation
          .advanceDue,
        calculated.calculation
          .advanceDeducted,

        calculated.calculation
          .otherDeduction,

        calculated.calculation
          .reservePercent,
        calculated.calculation
          .reserveAmount,

        calculated.calculation
          .totalDeduction,
        calculated.calculation
          .netPayable,

        balanceAmount,
        status,

        options.generatedBy ||
          "System",

        billId,
      ]
    );
  } else {
    billNumber =
      generateBillNumber({
        billMonth:
          options.billMonth,

        billCycle:
          options.billCycle,

        memberId:
          options.memberId,
      });

    const [result] =
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
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?,
            ?, ?,
            ?, ?,
            0, ?,
            ?, ?
          )
        `,
        [
          billNumber,
          options.memberId,
          options.billMonth,
          Number(
            options.billCycle
          ),
          calculated.period.fromDate,
          calculated.period.toDate,

          calculated.milkSummary.cowMilk,
          calculated.milkSummary
            .buffaloMilk,
          calculated.milkSummary
            .totalMilk,

          calculated.milkSummary.cowAmount,
          calculated.milkSummary
            .buffaloAmount,
          calculated.milkSummary
            .milkAmount,

          calculated.milkSummary
            .averageFat,
          calculated.milkSummary
            .averageSnf,

          calculated.calculation.feedDue,
          calculated.calculation
            .feedDeducted,

          calculated.calculation
            .advanceDue,
          calculated.calculation
            .advanceDeducted,

          calculated.calculation
            .otherDeduction,

          calculated.calculation
            .reservePercent,
          calculated.calculation
            .reserveAmount,

          calculated.calculation
            .totalDeduction,
          calculated.calculation
            .netPayable,

          calculated.calculation
            .netPayable,

          calculated.calculation.status,

          options.generatedBy ||
            "System",
        ]
      );

    billId = result.insertId;
  }

  await replaceBillItems(
    connection,
    billId,
    calculated.collections
  );

  await replaceBillDeductions(
    connection,
    billId,
    calculated.calculation
  );

  await allocateFeedDeduction(
    connection,
    billId,
    options.memberId,
    calculated.calculation.feedDeducted
  );

  await allocateAdvanceDeduction(
    connection,
    billId,
    options.memberId,
    calculated.calculation.advanceDeducted
  );

  const ledgerDate = calculated.period.toDate;
  const ledgerEntries = [
    {
      transactionType: "BILL_MILK_EARNING",
      description: `Milk earnings for bill ${billNumber}`,
      debit: 0,
      credit: calculated.milkSummary.milkAmount,
    },
    {
      transactionType: "BILL_FEED_DEDUCTION",
      description: "Feed recovery through bill",
      debit: calculated.calculation.feedDeducted,
      credit: 0,
    },
    {
      transactionType: "BILL_ADVANCE_DEDUCTION",
      description: "Advance recovery through bill",
      debit: calculated.calculation.advanceDeducted,
      credit: 0,
    },
    {
      transactionType: "BILL_RESERVE",
      description: `${calculated.calculation.reservePercent}% reserve deduction`,
      debit: calculated.calculation.reserveAmount,
      credit: 0,
    },
    {
      transactionType: "BILL_OTHER_DEDUCTION",
      description: "Other bill deduction",
      debit: calculated.calculation.otherDeduction,
      credit: 0,
    },
  ];

  for (const entry of ledgerEntries) {
    await postLedgerEntry(connection, {
      memberId: options.memberId,
      transactionDate: ledgerDate,
      transactionType: entry.transactionType,
      referenceType: "BILL",
      referenceId: billId,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      createdBy: options.generatedBy || "System",
    });
  }

  return createFlatBillResult({
    billId,
    billNumber,

    member:
      calculated.member,

    period:
      calculated.period,

    collections:
      calculated.collections,

    milkSummary:
      calculated.milkSummary,

    calculation:
      calculated.calculation,

    paidAmount,

    generated: true,
    existing:
      Boolean(existingBill),
  });
}

async function generateSingleMemberBill(
  options
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existingBill = await getExistingBill(
      connection,
      options.memberId,
      options.billMonth,
      options.billCycle
    );

    if (existingBill) {
      await restoreBillDeductionAllocations(
        connection,
        existingBill.bill_id
      );
    }

    const calculated =
      await calculateMemberBill({
        connection,
        ...options,
        lockRows: true,
      });

    if (calculated.skipped) {
      await connection.rollback();

      return {
        generated: false,
        skipped: true,
        reason:
          calculated.reason,
        member:
          calculated.member,
        period:
          calculated.period,
      };
    }

    const result =
      await saveCalculatedBill({
        connection,
        options,
        calculated,
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
    const members =
      await getActiveMembers(
        connection
      );

    const generatedBills = [];
    const skippedMembers = [];
    const failedMembers = [];

    for (const member of members) {
      try {
        const result =
          await generateSingleMemberBill({
            memberId:
              member.member_id,

            billMonth,
            billCycle,
            reservePercent,

            feedDue: 0,
            advanceDue: 0,

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
  } finally {
    connection.release();
  }
}

module.exports = {
  getMember,
  getActiveMembers,
  getMemberCollections,
  getExistingBill,
  getPendingFeedDue,
  getPendingAdvanceDue,
  restoreBillDeductionAllocations,
  calculateMemberBill,
  previewMemberBill,
  generateSingleMemberBill,
  generateAllMemberBills,
};
