const { pool } = require("../config/db");

function cleanText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function roundAmount(value) {
  return Number(toNumber(value).toFixed(2));
}

function validateEntry({ debit, credit }) {
  const d = roundAmount(debit);
  const c = roundAmount(credit);
  if (d < 0 || c < 0 || (d > 0 && c > 0)) {
    const error = new Error("Ledger entry must contain either debit or credit, not both");
    error.statusCode = 400;
    throw error;
  }
  return { debit: d, credit: c };
}

async function postLedgerEntry(connection, data) {
  const { debit, credit } = validateEntry(data);
  if (debit === 0 && credit === 0) return null;

  const memberId = cleanText(data.memberId);
  if (!memberId) {
    const error = new Error("Member ID is required for a ledger entry");
    error.statusCode = 400;
    throw error;
  }

  const [members] = await connection.execute(
    `SELECT member_id FROM members WHERE member_id = ? LIMIT 1`,
    [memberId]
  );
  if (!members.length) {
    const error = new Error(`Member ${memberId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const [result] = await connection.execute(
    `
      INSERT INTO financial_ledger (
        member_id,
        transaction_date,
        transaction_type,
        reference_type,
        reference_id,
        description,
        debit,
        credit,
        reversal_of_id,
        is_reversal,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      memberId,
      data.transactionDate || new Date().toISOString().slice(0, 10),
      cleanText(data.transactionType) || "Adjustment",
      cleanText(data.referenceType) || null,
      data.referenceId === undefined || data.referenceId === null ? null : String(data.referenceId),
      cleanText(data.description) || "Financial transaction",
      debit,
      credit,
      data.reversalOfId || null,
      data.isReversal ? 1 : 0,
      cleanText(data.createdBy) || "System",
    ]
  );

  return String(result.insertId);
}

/*
  Reverses all currently-active entries belonging to a reference.
  This is used when a bill/payment is regenerated or deleted.
*/
async function reverseReferenceEntries(connection, referenceType, referenceId, createdBy = "System") {
  const [rows] = await connection.execute(
    `
      SELECT *
      FROM financial_ledger
      WHERE reference_type = ?
        AND reference_id = ?
        AND is_reversal = 0
        AND reversal_of_id IS NULL
      ORDER BY ledger_id ASC
      FOR UPDATE
    `,
    [referenceType, String(referenceId)]
  );

  const reversed = [];

  for (const row of rows) {
    const reversalId = await postLedgerEntry(connection, {
      memberId: row.member_id,
      transactionDate: new Date().toISOString().slice(0, 10),
      transactionType: `${row.transaction_type}_REVERSAL`,
      referenceType: referenceType,
      referenceId: referenceId,
      description: `Reversal: ${row.description}`,
      debit: toNumber(row.credit),
      credit: toNumber(row.debit),
      reversalOfId: row.ledger_id,
      isReversal: true,
      createdBy,
    });

    await connection.execute(
      `UPDATE financial_ledger SET is_reversal = 1 WHERE ledger_id = ?`,
      [row.ledger_id]
    );

    reversed.push(reversalId);
  }

  return reversed;
}

async function getMemberLedger(memberId, filters = {}) {
  const conditions = ["l.member_id = ?"];
  const values = [String(memberId)];

  if (filters.fromDate) {
    conditions.push("l.transaction_date >= ?");
    values.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push("l.transaction_date <= ?");
    values.push(filters.toDate);
  }
  if (filters.transactionType) {
    conditions.push("l.transaction_type = ?");
    values.push(filters.transactionType);
  }
  if (filters.search) {
    const search = `%${cleanText(filters.search)}%`;
    conditions.push(`(
      l.description LIKE ? OR
      l.reference_type LIKE ? OR
      l.reference_id LIKE ? OR
      l.transaction_type LIKE ?
    )`);
    values.push(search, search, search, search);
  }

  const [rows] = await pool.execute(
    `
      SELECT
        l.ledger_id,
        l.member_id,
        m.name AS member_name,
        DATE_FORMAT(l.transaction_date, '%Y-%m-%d') AS transaction_date,
        l.transaction_type,
        l.reference_type,
        l.reference_id,
        l.description,
        l.debit,
        l.credit,
        l.reversal_of_id,
        l.is_reversal,
        l.created_by,
        l.created_at
      FROM financial_ledger l
      INNER JOIN members m ON m.member_id = l.member_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY l.transaction_date ASC, l.ledger_id ASC
    `,
    values
  );

  let balance = 0;
  const data = rows.map((row) => {
    balance = roundAmount(balance + toNumber(row.credit) - toNumber(row.debit));
    return {
      ledgerId: String(row.ledger_id),
      memberId: String(row.member_id),
      memberName: row.member_name || "",
      transactionDate: row.transaction_date,
      transactionType: row.transaction_type,
      referenceType: row.reference_type || "",
      referenceId: row.reference_id || "",
      description: row.description,
      debit: roundAmount(row.debit),
      credit: roundAmount(row.credit),
      balance,
      reversalOfId: row.reversal_of_id ? String(row.reversal_of_id) : null,
      isReversal: Boolean(row.is_reversal),
      createdBy: row.created_by || "",
      createdAt: row.created_at,
    };
  });

  return data;
}

async function getLedgerSummary(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.memberId) {
    conditions.push("member_id = ?");
    values.push(String(filters.memberId));
  }
  if (filters.fromDate) {
    conditions.push("transaction_date >= ?");
    values.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push("transaction_date <= ?");
    values.push(filters.toDate);
  }

  let query = `
    SELECT
      COUNT(*) AS transactionCount,
      COALESCE(SUM(debit), 0) AS totalDebit,
      COALESCE(SUM(credit), 0) AS totalCredit
    FROM financial_ledger
  `;

  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;

  const [rows] = await pool.execute(query, values);
  const row = rows[0] || {};

  return {
    transactionCount: Number(row.transactionCount || 0),
    totalDebit: roundAmount(row.totalDebit),
    totalCredit: roundAmount(row.totalCredit),
    netBalance: roundAmount(toNumber(row.totalCredit) - toNumber(row.totalDebit)),
  };
}

async function getAllLedger(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.memberId) {
    conditions.push("l.member_id = ?");
    values.push(String(filters.memberId));
  }
  if (filters.fromDate) {
    conditions.push("l.transaction_date >= ?");
    values.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push("l.transaction_date <= ?");
    values.push(filters.toDate);
  }
  if (filters.transactionType) {
    conditions.push("l.transaction_type = ?");
    values.push(filters.transactionType);
  }

  let query = `
    SELECT
      l.ledger_id,
      l.member_id,
      m.name AS member_name,
      DATE_FORMAT(l.transaction_date, '%Y-%m-%d') AS transaction_date,
      l.transaction_type,
      l.reference_type,
      l.reference_id,
      l.description,
      l.debit,
      l.credit,
      l.reversal_of_id,
      l.is_reversal,
      l.created_by,
      l.created_at
    FROM financial_ledger l
    INNER JOIN members m ON m.member_id = l.member_id
  `;

  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;
  query += ` ORDER BY l.transaction_date DESC, l.ledger_id DESC`;

  const [rows] = await pool.execute(query, values);
  return rows.map((row) => ({
    ledgerId: String(row.ledger_id),
    memberId: String(row.member_id),
    memberName: row.member_name || "",
    transactionDate: row.transaction_date,
    transactionType: row.transaction_type,
    referenceType: row.reference_type || "",
    referenceId: row.reference_id || "",
    description: row.description,
    debit: roundAmount(row.debit),
    credit: roundAmount(row.credit),
    reversalOfId: row.reversal_of_id ? String(row.reversal_of_id) : null,
    isReversal: Boolean(row.is_reversal),
    createdBy: row.created_by || "",
    createdAt: row.created_at,
  }));
}

module.exports = {
  postLedgerEntry,
  reverseReferenceEntries,
  getMemberLedger,
  getLedgerSummary,
  getAllLedger,
  roundAmount,
};
