const { pool } = require("../config/db");

function cleanText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundAmount(value) {
  return Number(toNumber(value).toFixed(2));
}

function mapAdvanceRow(row) {
  return {
    advanceId: String(row.advance_id),
    memberId: String(row.member_id),
    memberName: row.member_name || "",
    amount: toNumber(row.amount),
    remainingAmount: toNumber(row.remaining_amount),
    date: row.date,
    reason: row.reason || "",
    status: row.status,
    lastDeductedAmount: toNumber(row.last_deducted_amount),
    lastDeductedDate: row.last_deducted_date || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilters(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.memberId) {
    conditions.push("a.member_id = ?");
    values.push(cleanText(filters.memberId));
  }
  if (filters.status) {
    conditions.push("a.status = ?");
    values.push(cleanText(filters.status));
  }
  if (filters.fromDate) {
    conditions.push("a.date >= ?");
    values.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push("a.date <= ?");
    values.push(filters.toDate);
  }
  if (filters.search) {
    const search = `%${cleanText(filters.search)}%`;
    conditions.push(`(
      a.member_id LIKE ? OR
      a.member_name LIKE ? OR
      a.reason LIKE ? OR
      a.status LIKE ?
    )`);
    values.push(search, search, search, search);
  }

  return { conditions, values };
}

async function getAdvanceRecords(filters = {}) {
  const { conditions, values } = buildFilters(filters);
  let query = `
    SELECT
      a.advance_id,
      a.member_id,
      a.member_name,
      a.amount,
      a.remaining_amount,
      DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
      a.reason,
      a.status,
      a.last_deducted_amount,
      DATE_FORMAT(a.last_deducted_date, '%Y-%m-%d') AS last_deducted_date,
      a.created_at,
      a.updated_at
    FROM advances a
  `;

  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`;
  query += ` ORDER BY a.date DESC, a.advance_id DESC`;

  const [rows] = await pool.execute(query, values);
  return rows.map(mapAdvanceRow);
}

async function getAdvanceById(advanceId, connection = pool) {
  const [rows] = await connection.execute(
    `
      SELECT
        a.advance_id,
        a.member_id,
        a.member_name,
        a.amount,
        a.remaining_amount,
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
        a.reason,
        a.status,
        a.last_deducted_amount,
        DATE_FORMAT(a.last_deducted_date, '%Y-%m-%d') AS last_deducted_date,
        a.created_at,
        a.updated_at
      FROM advances a
      WHERE a.advance_id = ?
      LIMIT 1
    `,
    [advanceId]
  );

  return rows[0] ? mapAdvanceRow(rows[0]) : null;
}

async function createAdvanceRecord(data) {
  const memberId = cleanText(data.memberId);
  const memberName = cleanText(data.memberName);
  const amount = roundAmount(data.amount);
  const date = cleanText(data.date);
  const reason = cleanText(data.reason);
  const status = cleanText(data.status) || "Pending";

  if (!memberId || !memberName || !date) {
    const error = new Error("Please fill all required advance fields");
    error.statusCode = 400;
    throw error;
  }
  if (amount <= 0) {
    const error = new Error("Advance amount must be greater than zero");
    error.statusCode = 400;
    throw error;
  }

  const [members] = await pool.execute(
    `SELECT member_id FROM members WHERE member_id = ? LIMIT 1`,
    [memberId]
  );
  if (!members.length) {
    const error = new Error("Selected member does not exist");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.execute(
    `
      INSERT INTO advances (
        member_id,
        member_name,
        amount,
        remaining_amount,
        date,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [memberId, memberName, amount, amount, date, reason || null, status]
  );

  return getAdvanceById(result.insertId);
}

async function updateAdvanceRecord(advanceId, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT * FROM advances WHERE advance_id = ? FOR UPDATE`,
      [advanceId]
    );
    if (!rows.length) {
      const error = new Error("Advance record not found");
      error.statusCode = 404;
      throw error;
    }

    const old = rows[0];
    const amount = data.amount !== undefined ? roundAmount(data.amount) : toNumber(old.amount);
    if (amount <= 0) {
      const error = new Error("Advance amount must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    const memberId = data.memberId !== undefined ? cleanText(data.memberId) : String(old.member_id);
    const memberName = data.memberName !== undefined ? cleanText(data.memberName) : old.member_name;
    const date = data.date !== undefined ? cleanText(data.date) : old.date;
    const reason = data.reason !== undefined ? cleanText(data.reason) : (old.reason || "");

    if (data.memberId !== undefined) {
      const [members] = await connection.execute(
        `SELECT member_id FROM members WHERE member_id = ? LIMIT 1`,
        [memberId]
      );
      if (!members.length) {
        const error = new Error("Selected member does not exist");
        error.statusCode = 400;
        throw error;
      }
    }

    const recovered = Math.max(toNumber(old.amount) - toNumber(old.remaining_amount), 0);
    const requestedRemaining = data.remainingAmount !== undefined
      ? toNumber(data.remainingAmount)
      : Math.max(roundAmount(amount - recovered), 0);

    if (requestedRemaining < 0 || requestedRemaining > amount) {
      const error = new Error("Remaining amount must be between zero and the advance amount");
      error.statusCode = 400;
      throw error;
    }

    let status = data.status !== undefined ? cleanText(data.status) : old.status;
    if (requestedRemaining === 0) status = "Cleared";
    else if (recovered > 0) status = "Partially Deducted";

    await connection.execute(
      `
        UPDATE advances
        SET
          member_id = ?,
          member_name = ?,
          amount = ?,
          remaining_amount = ?,
          date = ?,
          reason = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE advance_id = ?
      `,
      [memberId, memberName, amount, requestedRemaining, date, reason || null, status, advanceId]
    );

    await connection.commit();
    return getAdvanceById(advanceId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deductAdvanceAmount(advanceId, deductionAmount) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT * FROM advances WHERE advance_id = ? FOR UPDATE`,
      [advanceId]
    );
    if (!rows.length) {
      const error = new Error("Advance record not found");
      error.statusCode = 404;
      throw error;
    }

    const requested = roundAmount(deductionAmount);
    if (requested <= 0) {
      const error = new Error("Deduction amount must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    const current = toNumber(rows[0].remaining_amount);
    const actual = roundAmount(Math.min(requested, current));
    const remaining = roundAmount(current - actual);
    const status = remaining === 0 ? "Cleared" : "Partially Deducted";

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
      [remaining, status, actual, advanceId]
    );

    await connection.commit();
    return getAdvanceById(advanceId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteAdvanceRecord(advanceId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [allocations] = await connection.execute(
      `SELECT COUNT(*) AS count FROM bill_deduction_allocations WHERE source_type = 'Advance' AND source_record_id = ?`,
      [String(advanceId)]
    );
    if (Number(allocations[0].count) > 0) {
      const error = new Error("Advance record cannot be deleted because it is linked to a bill deduction");
      error.statusCode = 409;
      throw error;
    }

    const record = await getAdvanceById(advanceId, connection);
    if (!record) {
      const error = new Error("Advance record not found");
      error.statusCode = 404;
      throw error;
    }

    await connection.execute(`DELETE FROM advances WHERE advance_id = ?`, [advanceId]);
    await connection.commit();
    return record;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAdvanceRecords,
  getAdvanceById,
  createAdvanceRecord,
  updateAdvanceRecord,
  deductAdvanceAmount,
  deleteAdvanceRecord,
  mapAdvanceRow,
  roundAmount,
};
