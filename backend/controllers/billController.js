const {
  pool,
} = require("../config/db");

const {
  getBillingPeriod,
  generatePaymentNumber,
  roundAmount,
} = require(
  "../utils/billCalculator"
);

const {
  reverseReferenceEntries,
} = require("../services/ledgerService");

const {
  generateSingleMemberBill,
  generateAllMemberBills,
  restoreBillDeductionAllocations,
} = require(
  "../services/billingService"
);

function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanNumber(value) {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : 0;
}

function mapBill(row) {
  return {
    billId:
      String(row.bill_id),

    billNumber:
      row.bill_number,

    memberId:
      String(row.member_id),

    memberName:
      row.member_name || "",

    mobile:
      row.mobile || "",

    village:
      row.village || "",

    billMonth:
      row.bill_month,

    billCycle:
      Number(row.bill_cycle),

    periodFrom:
      row.period_from,

    periodTo:
      row.period_to,

    cowMilk:
      Number(row.cow_milk),

    buffaloMilk:
      Number(
        row.buffalo_milk
      ),

    totalMilk:
      Number(row.total_milk),

    cowAmount:
      Number(row.cow_amount),

    buffaloAmount:
      Number(
        row.buffalo_amount
      ),

    milkAmount:
      Number(row.milk_amount),

    averageFat:
      Number(row.average_fat),

    averageSnf:
      Number(row.average_snf),

    feedDue:
      Number(row.feed_due),

    feedDeducted:
      Number(
        row.feed_deducted
      ),

    advanceDue:
      Number(row.advance_due),

    advanceDeducted:
      Number(
        row.advance_deducted
      ),

    otherDeduction:
      Number(
        row.other_deduction
      ),

    reservePercent:
      Number(
        row.reserve_percent
      ),

    reserveAmount:
      Number(
        row.reserve_amount
      ),

    totalDeduction:
      Number(
        row.total_deduction
      ),

    netPayable:
      Number(row.net_payable),

    paidAmount:
      Number(row.paid_amount),

    balanceAmount:
      Number(
        row.balance_amount
      ),

    status: row.status,

    generatedBy:
      row.generated_by || "",

    generatedAt:
      row.generated_at,

    updatedAt:
      row.updated_at,
  };
}

const billSelectQuery = `
  SELECT
    b.bill_id,
    b.bill_number,
    b.member_id,

    m.name AS member_name,
    m.mobile,
    m.village,

    b.bill_month,
    b.bill_cycle,

    DATE_FORMAT(
      b.period_from,
      '%Y-%m-%d'
    ) AS period_from,

    DATE_FORMAT(
      b.period_to,
      '%Y-%m-%d'
    ) AS period_to,

    b.cow_milk,
    b.buffalo_milk,
    b.total_milk,

    b.cow_amount,
    b.buffalo_amount,
    b.milk_amount,

    b.average_fat,
    b.average_snf,

    b.feed_due,
    b.feed_deducted,

    b.advance_due,
    b.advance_deducted,

    b.other_deduction,

    b.reserve_percent,
    b.reserve_amount,

    b.total_deduction,
    b.net_payable,

    b.paid_amount,
    b.balance_amount,

    b.status,
    b.generated_by,
    b.generated_at,
    b.updated_at

  FROM bills b

  INNER JOIN members m
    ON m.member_id =
       b.member_id
`;

/*
  POST /api/bills/generate

  Body:

  {
    memberId: "1",
    billMonth: "2026-07",
    billCycle: 1,
    reservePercent: 10,
    otherDeduction: 0,
    generatedBy: "Admin"
  }
*/
async function generateBill(
  req,
  res
) {
  try {
    const memberId =
      cleanText(
        req.body.memberId
      );

    const billMonth =
      cleanText(
        req.body.billMonth
      );

    const billCycle =
      Number(
        req.body.billCycle
      );

    const reservePercent =
      req.body.reservePercent ===
      undefined
        ? 10
        : cleanNumber(
            req.body
              .reservePercent
          );

    const otherDeduction =
      cleanNumber(
        req.body.otherDeduction
      );

    const generatedBy =
      cleanText(
        req.body.generatedBy
      ) || "System";

    if (
      !memberId ||
      !billMonth ||
      !billCycle
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Member, billing month and billing cycle are required",
        });
    }

    getBillingPeriod(
      billMonth,
      billCycle
    );

    const result =
      await generateSingleMemberBill(
        {
          memberId,
          billMonth,
          billCycle,
          reservePercent,
          otherDeduction,
          generatedBy,
        }
      );

    if (result.skipped) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "No milk collections found for the selected member and billing period",

          data: result,
        });
    }

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Member bill generated successfully",

        data: result,
      });
  } catch (error) {
    console.error(
      "Generate bill error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to generate member bill",
      });
  }
}

/*
  POST /api/bills/generate-all
*/
async function generateAllBills(
  req,
  res
) {
  try {
    const billMonth =
      cleanText(
        req.body.billMonth
      );

    const billCycle =
      Number(
        req.body.billCycle
      );

    const reservePercent =
      req.body.reservePercent ===
      undefined
        ? 10
        : cleanNumber(
            req.body
              .reservePercent
          );

    const otherDeduction =
      cleanNumber(
        req.body.otherDeduction
      );

    const generatedBy =
      cleanText(
        req.body.generatedBy
      ) || "System";

    if (
      !billMonth ||
      !billCycle
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Billing month and cycle are required",
        });
    }

    getBillingPeriod(
      billMonth,
      billCycle
    );

    const result =
      await generateAllMemberBills(
        {
          billMonth,
          billCycle,
          reservePercent,
          otherDeduction,
          generatedBy,
        }
      );

    return res
      .status(201)
      .json({
        success: true,

        message:
          `${result.generatedCount} bills generated successfully`,

        data: result,
      });
  } catch (error) {
    console.error(
      "Generate all bills error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to generate bills",
      });
  }
}

/*
  GET /api/bills

  Optional filters:

  billMonth
  billCycle
  memberId
  status
  search
  fromDate
  toDate
*/
async function getAllBills(
  req,
  res
) {
  try {
    const {
      billMonth,
      billCycle,
      memberId,
      status,
      search,
      fromDate,
      toDate,
    } = req.query;

    const conditions = [];
    const values = [];

    if (billMonth) {
      conditions.push(
        "b.bill_month = ?"
      );

      values.push(
        cleanText(billMonth)
      );
    }

    if (billCycle) {
      conditions.push(
        "b.bill_cycle = ?"
      );

      values.push(
        Number(billCycle)
      );
    }

    if (memberId) {
      conditions.push(
        "b.member_id = ?"
      );

      values.push(
        cleanText(memberId)
      );
    }

    if (status) {
      conditions.push(
        "b.status = ?"
      );

      values.push(
        cleanText(status)
      );
    }

    if (fromDate) {
      conditions.push(
        "b.period_from >= ?"
      );

      values.push(
        cleanText(fromDate)
      );
    }

    if (toDate) {
      conditions.push(
        "b.period_to <= ?"
      );

      values.push(
        cleanText(toDate)
      );
    }

    if (search) {
      conditions.push(`
        (
          b.bill_number LIKE ?
          OR b.member_id LIKE ?
          OR m.name LIKE ?
          OR m.mobile LIKE ?
          OR m.village LIKE ?
        )
      `);

      const searchValue =
        `%${cleanText(
          search
        )}%`;

      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    let query =
      billSelectQuery;

    if (
      conditions.length > 0
    ) {
      query += `
        WHERE ${conditions.join(
          " AND "
        )}
      `;
    }

    query += `
      ORDER BY
        b.period_from DESC,
        CAST(
          b.member_id
          AS UNSIGNED
        ),
        b.member_id,
        b.bill_id DESC
    `;

    const [rows] =
      await pool.execute(
        query,
        values
      );

    return res
      .status(200)
      .json({
        success: true,
        count: rows.length,
        data: rows.map(mapBill),
      });
  } catch (error) {
    console.error(
      "Get bills error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load bills",
      });
  }
}

/*
  GET /api/bills/summary
*/
async function getBillSummary(
  req,
  res
) {
  try {
    const billMonth =
      cleanText(
        req.query.billMonth
      );

    const billCycle =
      cleanText(
        req.query.billCycle
      );

    const conditions = [];
    const values = [];

    if (billMonth) {
      conditions.push(
        "bill_month = ?"
      );

      values.push(billMonth);
    }

    if (billCycle) {
      conditions.push(
        "bill_cycle = ?"
      );

      values.push(
        Number(billCycle)
      );
    }

    let query = `
      SELECT
        COUNT(*) AS generated_bills,

        COALESCE(
          SUM(milk_amount),
          0
        ) AS milk_amount,

        COALESCE(
          SUM(total_deduction),
          0
        ) AS total_deduction,

        COALESCE(
          SUM(net_payable),
          0
        ) AS net_payable,

        COALESCE(
          SUM(paid_amount),
          0
        ) AS paid_amount,

        COALESCE(
          SUM(balance_amount),
          0
        ) AS balance_amount,

        SUM(
          CASE
            WHEN status = 'Pending'
            THEN 1
            ELSE 0
          END
        ) AS pending_bills,

        SUM(
          CASE
            WHEN status =
                 'Partially Paid'
            THEN 1
            ELSE 0
          END
        ) AS partially_paid_bills,

        SUM(
          CASE
            WHEN status = 'Paid'
            THEN 1
            ELSE 0
          END
        ) AS paid_bills,

        SUM(
          CASE
            WHEN status =
                 'Cancelled'
            THEN 1
            ELSE 0
          END
        ) AS cancelled_bills

      FROM bills
    `;

    if (
      conditions.length > 0
    ) {
      query += `
        WHERE ${conditions.join(
          " AND "
        )}
      `;
    }

    const [rows] =
      await pool.execute(
        query,
        values
      );

    const row =
      rows[0] || {};

    return res
      .status(200)
      .json({
        success: true,

        data: {
          generatedBills:
            Number(
              row.generated_bills ||
                0
            ),

          milkAmount:
            Number(
              row.milk_amount || 0
            ),

          totalDeduction:
            Number(
              row.total_deduction ||
                0
            ),

          netPayable:
            Number(
              row.net_payable || 0
            ),

          paidAmount:
            Number(
              row.paid_amount || 0
            ),

          balanceAmount:
            Number(
              row.balance_amount ||
                0
            ),

          pendingBills:
            Number(
              row.pending_bills ||
                0
            ),

          partiallyPaidBills:
            Number(
              row.partially_paid_bills ||
                0
            ),

          paidBills:
            Number(
              row.paid_bills || 0
            ),

          cancelledBills:
            Number(
              row.cancelled_bills ||
                0
            ),
        },
      });
  } catch (error) {
    console.error(
      "Bill summary error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load bill summary",
      });
  }
}

/*
  GET /api/bills/member/:memberId
*/
async function getMemberBills(
  req,
  res
) {
  req.query.memberId =
    req.params.memberId;

  return getAllBills(req, res);
}

/*
  GET /api/bills/:id
*/
async function getBillById(
  req,
  res
) {
  try {
    const billId =
      cleanText(req.params.id);

    const [billRows] =
      await pool.execute(
        `
          ${billSelectQuery}

          WHERE b.bill_id = ?

          LIMIT 1
        `,
        [billId]
      );

    if (
      billRows.length === 0
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Bill not found",
        });
    }

    const [itemRows] =
      await pool.execute(
        `
          SELECT
            bill_item_id,
            bill_id,
            collection_id,

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

          FROM bill_items

          WHERE bill_id = ?

          ORDER BY
            collection_date ASC,

            FIELD(
              session,
              'Morning',
              'Evening'
            ),

            collection_time ASC
        `,
        [billId]
      );

    const [paymentRows] =
      await pool.execute(
        `
          SELECT
            payment_id,
            bill_id,
            payment_number,

            DATE_FORMAT(
              payment_date,
              '%Y-%m-%d'
            ) AS payment_date,

            amount,
            payment_method,
            reference_number,
            note,
            received_by,
            created_at

          FROM bill_payments

          WHERE bill_id = ?

          ORDER BY
            payment_date DESC,
            payment_id DESC
        `,
        [billId]
      );

    const [deductionRows] =
      await pool.execute(
        `
          SELECT
            deduction_id,
            deduction_type,
            source_record_id,
            description,
            due_amount,
            deducted_amount,
            remaining_amount

          FROM bill_deductions

          WHERE bill_id = ?

          ORDER BY deduction_id
        `,
        [billId]
      );

    return res
      .status(200)
      .json({
        success: true,

        data: {
          ...mapBill(
            billRows[0]
          ),

          items:
            itemRows.map(
              (item) => ({
                billItemId:
                  String(
                    item.bill_item_id
                  ),

                collectionId:
                  String(
                    item.collection_id
                  ),

                collectionDate:
                  item.collection_date,

                collectionTime:
                  item.collection_time,

                milkType:
                  item.milk_type,

                session:
                  item.session,

                quantity:
                  Number(
                    item.quantity
                  ),

                fat:
                  Number(item.fat),

                snf:
                  Number(item.snf),

                rate:
                  Number(item.rate),

                amount:
                  Number(
                    item.amount
                  ),
              })
            ),

          payments:
            paymentRows.map(
              (payment) => ({
                paymentId:
                  String(
                    payment.payment_id
                  ),

                paymentNumber:
                  payment.payment_number,

                paymentDate:
                  payment.payment_date,

                amount:
                  Number(
                    payment.amount
                  ),

                paymentMethod:
                  payment.payment_method,

                referenceNumber:
                  payment.reference_number ||
                  "",

                note:
                  payment.note || "",

                receivedBy:
                  payment.received_by ||
                  "",

                createdAt:
                  payment.created_at,
              })
            ),

          deductions:
            deductionRows.map(
              (deduction) => ({
                deductionId:
                  String(
                    deduction.deduction_id
                  ),

                type:
                  deduction.deduction_type,

                sourceRecordId:
                  deduction.source_record_id,

                description:
                  deduction.description ||
                  "",

                dueAmount:
                  Number(
                    deduction.due_amount
                  ),

                deductedAmount:
                  Number(
                    deduction.deducted_amount
                  ),

                remainingAmount:
                  Number(
                    deduction.remaining_amount
                  ),
              })
            ),
        },
      });
  } catch (error) {
    console.error(
      "Get bill error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to load bill",
      });
  }
}

/*
  PUT /api/bills/:id

  Allows manual adjustment of:

  otherDeduction
  reservePercent
  status
*/
async function updateBill(
  req,
  res
) {
  try {
    const billId =
      cleanText(req.params.id);

    const [existingRows] =
      await pool.execute(
        `
          SELECT *
          FROM bills
          WHERE bill_id = ?
          LIMIT 1
        `,
        [billId]
      );

    if (
      existingRows.length === 0
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Bill not found",
        });
    }

    const existing =
      existingRows[0];

    const otherDeduction =
      req.body.otherDeduction ===
      undefined
        ? Number(
            existing
              .other_deduction
          )
        : Math.max(
            0,
            cleanNumber(
              req.body
                .otherDeduction
            )
          );

    const reservePercent =
      req.body.reservePercent ===
      undefined
        ? Number(
            existing
              .reserve_percent
          )
        : Math.max(
            0,
            cleanNumber(
              req.body
                .reservePercent
            )
          );

    const reserveAmount =
      roundAmount(
        Number(
          existing.milk_amount
        ) *
          (reservePercent /
            100)
      );

    const totalDeduction =
      roundAmount(
        reserveAmount +
          Number(
            existing
              .feed_deducted
          ) +
          Number(
            existing
              .advance_deducted
          ) +
          otherDeduction
      );

    const netPayable =
      roundAmount(
        Math.max(
          0,
          Number(
            existing.milk_amount
          ) -
            totalDeduction
        )
      );

    const paidAmount =
      roundAmount(
        existing.paid_amount
      );

    const balanceAmount =
      roundAmount(
        Math.max(
          0,
          netPayable -
            paidAmount
        )
      );

    let status =
      cleanText(
        req.body.status
      );

    if (!status) {
      status =
        balanceAmount <= 0
          ? "Paid"
          : paidAmount > 0
            ? "Partially Paid"
            : "Pending";
    }

    const allowedStatuses = [
      "Pending",
      "Partially Paid",
      "Paid",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid bill status",
        });
    }

    await pool.execute(
      `
        UPDATE bills
        SET
          other_deduction = ?,
          reserve_percent = ?,
          reserve_amount = ?,
          total_deduction = ?,
          net_payable = ?,
          balance_amount = ?,
          status = ?
        WHERE bill_id = ?
      `,
      [
        otherDeduction,
        reservePercent,
        reserveAmount,
        totalDeduction,
        netPayable,
        balanceAmount,
        status,
        billId,
      ]
    );

    return getBillById(
      req,
      res
    );
  } catch (error) {
    console.error(
      "Update bill error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to update bill",
      });
  }
}

/*
  POST /api/bills/:id/payments
*/
async function addBillPayment(
  req,
  res
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const billId =
      cleanText(req.params.id);

    const amount =
      cleanNumber(
        req.body.amount
      );

    const paymentDate =
      cleanText(
        req.body.paymentDate
      ) ||
      new Date()
        .toISOString()
        .split("T")[0];

    const paymentMethod =
      cleanText(
        req.body.paymentMethod
      ) || "Cash";

    const referenceNumber =
      cleanText(
        req.body
          .referenceNumber
      );

    const note =
      cleanText(req.body.note);

    const receivedBy =
      cleanText(
        req.body.receivedBy
      ) || "System";

    if (amount <= 0) {
      await connection.rollback();

      return res
        .status(400)
        .json({
          success: false,

          message:
            "Payment amount must be greater than zero",
        });
    }

    const [billRows] =
      await connection.execute(
        `
          SELECT
            bill_id,
            net_payable,
            paid_amount,
            balance_amount,
            status
          FROM bills
          WHERE bill_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [billId]
      );

    if (
      billRows.length === 0
    ) {
      await connection.rollback();

      return res
        .status(404)
        .json({
          success: false,
          message:
            "Bill not found",
        });
    }

    const bill =
      billRows[0];

    if (
      bill.status ===
      "Cancelled"
    ) {
      await connection.rollback();

      return res
        .status(400)
        .json({
          success: false,

          message:
            "Payment cannot be recorded for a cancelled bill",
        });
    }

    const currentBalance =
      Number(
        bill.balance_amount
      );

    if (
      amount >
      currentBalance
    ) {
      await connection.rollback();

      return res
        .status(400)
        .json({
          success: false,

          message:
            `Payment cannot exceed the pending balance of ₹${currentBalance.toFixed(
              2
            )}`,
        });
    }

    const paymentNumber =
      generatePaymentNumber();

    const [paymentResult] =
      await connection.execute(
        `
          INSERT INTO bill_payments (
            bill_id,
            payment_number,
            payment_date,
            amount,
            payment_method,
            reference_number,
            note,
            received_by
          )
          VALUES (
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
          paymentNumber,
          paymentDate,
          amount,
          paymentMethod,
          referenceNumber ||
            null,
          note || null,
          receivedBy,
        ]
      );

    const newPaidAmount =
      roundAmount(
        Number(
          bill.paid_amount
        ) + amount
      );

    const newBalanceAmount =
      roundAmount(
        Math.max(
          0,
          Number(
            bill.net_payable
          ) -
            newPaidAmount
        )
      );

    const newStatus =
      newBalanceAmount <= 0
        ? "Paid"
        : "Partially Paid";

    await connection.execute(
      `
        UPDATE bills
        SET
          paid_amount = ?,
          balance_amount = ?,
          status = ?
        WHERE bill_id = ?
      `,
      [
        newPaidAmount,
        newBalanceAmount,
        newStatus,
        billId,
      ]
    );

    await connection.commit();

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Bill payment recorded successfully",

        data: {
          paymentId:
            String(
              paymentResult.insertId
            ),

          paymentNumber,

          billId,

          amount:
            roundAmount(amount),

          paidAmount:
            newPaidAmount,

          balanceAmount:
            newBalanceAmount,

          status:
            newStatus,
        },
      });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Bill payment error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Unable to record bill payment",
      });
  } finally {
    connection.release();
  }
}

/*
  DELETE /api/bills/:id

  Bills containing payments cannot
  be deleted.
*/
async function deleteBill(
  req,
  res
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const billId = cleanText(req.params.id);

    const [billRows] = await connection.execute(
      `
        SELECT
          bill_id,
          bill_number,
          paid_amount
        FROM bills
        WHERE bill_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [billId]
    );

    if (billRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    if (Number(billRows[0].paid_amount) > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "A bill with recorded payments cannot be deleted",
      });
    }

    // Return any Feed/Advance amounts allocated by this bill before the
    // bill itself is deleted. The allocation rows then cascade away.
    await restoreBillDeductionAllocations(
      connection,
      billId
    );

    // Preserve financial history by reversing the bill ledger entries
    // before the bill is removed.
    await reverseReferenceEntries(
      connection,
      "BILL",
      billId,
      req.user?.username || "System"
    );

    await connection.execute(
      `DELETE FROM bills WHERE bill_id = ?`,
      [billId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
      data: {
        billId,
        billNumber: billRows[0].bill_number,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete bill error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to delete bill",
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  generateBill,
  generateAllBills,
  getAllBills,
  getBillSummary,
  getMemberBills,
  getBillById,
  updateBill,
  addBillPayment,
  deleteBill,
};