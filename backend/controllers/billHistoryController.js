const { pool } = require("../config/db");

function cleanText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

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

async function getBillHistory(req, res) {
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
      conditions.push("b.bill_month = ?");
      values.push(cleanText(billMonth));
    }

    if (billCycle) {
      conditions.push("b.bill_cycle = ?");
      values.push(Number(billCycle));
    }

    if (memberId) {
      conditions.push("b.member_id = ?");
      values.push(cleanText(memberId));
    }

    if (status) {
      conditions.push("b.status = ?");
      values.push(cleanText(status));
    }

    if (fromDate) {
      conditions.push("b.period_from >= ?");
      values.push(cleanText(fromDate));
    }

    if (toDate) {
      conditions.push("b.period_to <= ?");
      values.push(cleanText(toDate));
    }

    if (search) {
      conditions.push(`(
        b.bill_number LIKE ?
        OR b.member_id LIKE ?
        OR m.name LIKE ?
        OR m.mobile LIKE ?
        OR m.village LIKE ?
      )`);

      const searchValue = `%${cleanText(search)}%`;
      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    let query = `
      SELECT
        b.bill_id AS billId,
        b.bill_number AS billNumber,
        b.member_id AS memberId,
        m.name AS memberName,
        m.mobile,
        m.village,
        b.bill_month AS billMonth,
        b.bill_cycle AS billCycle,
        DATE_FORMAT(b.period_from, '%Y-%m-%d') AS periodFrom,
        DATE_FORMAT(b.period_to, '%Y-%m-%d') AS periodTo,
        b.total_milk AS totalMilk,
        b.milk_amount AS milkAmount,
        b.total_deduction AS totalDeduction,
        b.net_payable AS netPayable,
        b.paid_amount AS paidAmount,
        b.balance_amount AS balanceAmount,
        b.status,
        b.generated_by AS generatedBy,
        b.generated_at AS generatedAt,
        b.updated_at AS updatedAt,
        COUNT(DISTINCT bi.bill_item_id) AS collectionCount,
        COUNT(DISTINCT bp.payment_id) AS paymentCount
      FROM bills b
      INNER JOIN members m ON m.member_id = b.member_id
      LEFT JOIN bill_items bi ON bi.bill_id = b.bill_id
      LEFT JOIN bill_payments bp ON bp.bill_id = b.bill_id
    `;

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      GROUP BY
        b.bill_id, b.bill_number, b.member_id, m.name, m.mobile, m.village,
        b.bill_month, b.bill_cycle, b.period_from, b.period_to,
        b.total_milk, b.milk_amount, b.total_deduction,
        b.net_payable, b.paid_amount, b.balance_amount, b.status,
        b.generated_by, b.generated_at, b.updated_at
      ORDER BY b.generated_at DESC, b.bill_id DESC
    `;

    const [rows] = await pool.execute(query, values);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        ...row,
        billId: String(row.billId),
        memberId: String(row.memberId),
        billCycle: Number(row.billCycle),
        totalMilk: toNumber(row.totalMilk),
        milkAmount: toNumber(row.milkAmount),
        totalDeduction: toNumber(row.totalDeduction),
        netPayable: toNumber(row.netPayable),
        paidAmount: toNumber(row.paidAmount),
        balanceAmount: toNumber(row.balanceAmount),
        collectionCount: Number(row.collectionCount || 0),
        paymentCount: Number(row.paymentCount || 0),
      })),
    });
  } catch (error) {
    return sendError(res, error, "Unable to load bill history");
  }
}

async function cancelBill(req, res) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const billId = req.params.billId;

    const [rows] = await connection.execute(
      `SELECT bill_id, bill_number, paid_amount, status
       FROM bills WHERE bill_id = ? FOR UPDATE`,
      [billId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    const bill = rows[0];

    if (Number(bill.paid_amount) > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "A bill with recorded payments cannot be cancelled",
      });
    }

    if (bill.status === "Cancelled") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Bill is already cancelled",
      });
    }

    await connection.execute(
      `UPDATE bills SET status = 'Cancelled' WHERE bill_id = ?`,
      [billId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Bill cancelled successfully",
      data: {
        billId: String(billId),
        billNumber: bill.bill_number,
        status: "Cancelled",
      },
    });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error, "Unable to cancel bill");
  } finally {
    connection.release();
  }
}

module.exports = {
  getBillHistory,
  cancelBill,
};
