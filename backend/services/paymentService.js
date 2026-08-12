const { pool } = require("../config/db");
const { generatePaymentNumber, roundAmount } = require("../utils/billCalculator");
const { postLedgerEntry, reverseReferenceEntries } = require("./ledgerService");

function cleanText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function recordBillPayment({
  billId,
  amount,
  paymentDate,
  paymentMethod = "Cash",
  referenceNumber = "",
  note = "",
  receivedBy = "System",
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [billRows] = await connection.execute(
      `SELECT bill_id, bill_number, net_payable, paid_amount, balance_amount, status
       FROM bills WHERE bill_id = ? FOR UPDATE`,
      [billId]
    );

    if (billRows.length === 0) {
      const error = new Error("Bill not found");
      error.statusCode = 404;
      throw error;
    }

    const bill = billRows[0];

    if (bill.status === "Cancelled") {
      const error = new Error("Payment cannot be added to a cancelled bill");
      error.statusCode = 409;
      throw error;
    }

    const paymentAmount = roundAmount(amount);

    if (paymentAmount <= 0) {
      const error = new Error("Payment amount must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    const balance = roundAmount(bill.balance_amount);

    if (paymentAmount > balance) {
      const error = new Error(
        `Payment cannot exceed the remaining balance of ₹${balance.toFixed(2)}`
      );
      error.statusCode = 400;
      throw error;
    }

    const paymentNumber = generatePaymentNumber();

    const [result] = await connection.execute(
      `INSERT INTO bill_payments
       (bill_id, payment_number, payment_date, amount, payment_method,
        reference_number, note, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billId,
        paymentNumber,
        paymentDate || new Date().toISOString().slice(0, 10),
        paymentAmount,
        cleanText(paymentMethod) || "Cash",
        cleanText(referenceNumber) || null,
        cleanText(note) || null,
        cleanText(receivedBy) || "System",
      ]
    );

    const paidAmount = roundAmount(toNumber(bill.paid_amount) + paymentAmount);
    const balanceAmount = roundAmount(
      Math.max(toNumber(bill.net_payable) - paidAmount, 0)
    );
    const status = balanceAmount <= 0 ? "Paid" : "Partially Paid";

    await connection.execute(
      `UPDATE bills
       SET paid_amount = ?, balance_amount = ?, status = ?
       WHERE bill_id = ?`,
      [paidAmount, balanceAmount, status, billId]
    );

    const [memberRows] = await connection.execute(
      `SELECT member_id FROM bills WHERE bill_id = ? LIMIT 1`,
      [billId]
    );

    await postLedgerEntry(connection, {
      memberId: memberRows[0].member_id,
      transactionDate: paymentDate || new Date().toISOString().slice(0, 10),
      transactionType: "PAYMENT",
      referenceType: "PAYMENT",
      referenceId: result.insertId,
      description: `Payment received for bill ${bill.bill_number}`,
      debit: paymentAmount,
      credit: 0,
      createdBy: cleanText(receivedBy) || "System",
    });

    await connection.commit();

    return {
      paymentId: String(result.insertId),
      paymentNumber,
      billId: String(billId),
      billNumber: bill.bill_number,
      amount: paymentAmount,
      paidAmount,
      balanceAmount,
      status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getPayments(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.billId) {
    conditions.push("p.bill_id = ?");
    values.push(filters.billId);
  }

  if (filters.memberId) {
    conditions.push("b.member_id = ?");
    values.push(filters.memberId);
  }

  if (filters.fromDate) {
    conditions.push("p.payment_date >= ?");
    values.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("p.payment_date <= ?");
    values.push(filters.toDate);
  }

  if (filters.paymentMethod) {
    conditions.push("p.payment_method = ?");
    values.push(filters.paymentMethod);
  }

  if (filters.search) {
    conditions.push(`(
      p.payment_number LIKE ?
      OR b.bill_number LIKE ?
      OR b.member_id LIKE ?
      OR m.name LIKE ?
      OR p.reference_number LIKE ?
      OR p.received_by LIKE ?
    )`);
    const value = `%${filters.search}%`;
    values.push(value, value, value, value, value, value);
  }

  let query = `
    SELECT
      p.payment_id AS paymentId,
      p.bill_id AS billId,
      p.payment_number AS paymentNumber,
      DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS paymentDate,
      p.amount,
      p.payment_method AS paymentMethod,
      p.reference_number AS referenceNumber,
      p.note,
      p.received_by AS receivedBy,
      p.created_at AS createdAt,
      b.bill_number AS billNumber,
      b.member_id AS memberId,
      b.bill_month AS billMonth,
      b.bill_cycle AS billCycle,
      b.net_payable AS netPayable,
      b.paid_amount AS paidAmount,
      b.balance_amount AS balanceAmount,
      b.status AS billStatus,
      m.name AS memberName,
      m.mobile,
      m.village
    FROM bill_payments p
    INNER JOIN bills b ON b.bill_id = p.bill_id
    INNER JOIN members m ON m.member_id = b.member_id
  `;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY p.payment_date DESC, p.payment_id DESC`;

  const [rows] = await pool.execute(query, values);

  return rows.map((row) => ({
    ...row,
    paymentId: String(row.paymentId),
    billId: String(row.billId),
    memberId: String(row.memberId),
    amount: toNumber(row.amount),
    netPayable: toNumber(row.netPayable),
    paidAmount: toNumber(row.paidAmount),
    balanceAmount: toNumber(row.balanceAmount),
  }));
}

async function getPaymentSummary(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.fromDate) {
    conditions.push("payment_date >= ?");
    values.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("payment_date <= ?");
    values.push(filters.toDate);
  }

  if (filters.paymentMethod) {
    conditions.push("payment_method = ?");
    values.push(filters.paymentMethod);
  }

  let query = `
    SELECT
      COUNT(*) AS paymentCount,
      COALESCE(SUM(amount), 0) AS totalReceived,
      COALESCE(SUM(payment_method = 'Cash'), 0) AS cashPayments,
      COALESCE(SUM(payment_method = 'UPI'), 0) AS upiPayments,
      COALESCE(SUM(payment_method = 'Bank Transfer'), 0) AS bankPayments,
      COALESCE(SUM(payment_method = 'Cheque'), 0) AS chequePayments
    FROM bill_payments
  `;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  const [rows] = await pool.execute(query, values);
  const row = rows[0] || {};

  return {
    paymentCount: Number(row.paymentCount || 0),
    totalReceived: toNumber(row.totalReceived),
    cashPayments: Number(row.cashPayments || 0),
    upiPayments: Number(row.upiPayments || 0),
    bankPayments: Number(row.bankPayments || 0),
    chequePayments: Number(row.chequePayments || 0),
  };
}

async function deletePayment(paymentId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [paymentRows] = await connection.execute(
      `SELECT payment_id, bill_id, payment_number, amount
       FROM bill_payments WHERE payment_id = ? FOR UPDATE`,
      [paymentId]
    );

    if (paymentRows.length === 0) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    const payment = paymentRows[0];

    const [billRows] = await connection.execute(
      `SELECT bill_id, net_payable, paid_amount
       FROM bills WHERE bill_id = ? FOR UPDATE`,
      [payment.bill_id]
    );

    if (billRows.length === 0) {
      const error = new Error("Related bill not found");
      error.statusCode = 404;
      throw error;
    }

    const bill = billRows[0];

    await reverseReferenceEntries(
      connection,
      "PAYMENT",
      paymentId,
      "System"
    );

    await connection.execute(
      `DELETE FROM bill_payments WHERE payment_id = ?`,
      [paymentId]
    );

    const paidAmount = roundAmount(
      Math.max(toNumber(bill.paid_amount) - toNumber(payment.amount), 0)
    );
    const balanceAmount = roundAmount(
      Math.max(toNumber(bill.net_payable) - paidAmount, 0)
    );
    const status =
      balanceAmount <= 0
        ? "Paid"
        : paidAmount > 0
          ? "Partially Paid"
          : "Pending";

    await connection.execute(
      `UPDATE bills
       SET paid_amount = ?, balance_amount = ?, status = ?
       WHERE bill_id = ?`,
      [paidAmount, balanceAmount, status, payment.bill_id]
    );

    await connection.commit();

    return {
      paymentId: String(paymentId),
      paymentNumber: payment.payment_number,
      billId: String(payment.bill_id),
      paidAmount,
      balanceAmount,
      status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  recordBillPayment,
  getPayments,
  getPaymentSummary,
  deletePayment,
};
