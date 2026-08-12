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

function mapFeedRow(row) {
  return {
    feedId: String(row.feed_id),
    memberId: String(row.member_id),
    memberName: row.member_name || "",
    feedType: row.feed_type || "",
    quantity: toNumber(row.quantity),
    rate: toNumber(row.rate),
    amount: toNumber(row.amount),
    remainingAmount: toNumber(row.remaining_amount),
    date: row.date,
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
    conditions.push("f.member_id = ?");
    values.push(cleanText(filters.memberId));
  }

  if (filters.status) {
    conditions.push("f.status = ?");
    values.push(cleanText(filters.status));
  }

  if (filters.fromDate) {
    conditions.push("f.date >= ?");
    values.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("f.date <= ?");
    values.push(filters.toDate);
  }

  if (filters.search) {
    const search = `%${cleanText(filters.search)}%`;
    conditions.push(`(
      f.member_id LIKE ? OR
      f.member_name LIKE ? OR
      f.feed_type LIKE ? OR
      f.status LIKE ?
    )`);
    values.push(search, search, search, search);
  }

  return { conditions, values };
}

async function getFeedRecords(filters = {}) {
  const { conditions, values } = buildFilters(filters);

  let query = `
    SELECT
      f.feed_id,
      f.member_id,
      f.member_name,
      f.feed_type,
      f.quantity,
      f.rate,
      f.amount,
      f.remaining_amount,
      DATE_FORMAT(f.date, '%Y-%m-%d') AS date,
      f.status,
      f.last_deducted_amount,
      DATE_FORMAT(f.last_deducted_date, '%Y-%m-%d') AS last_deducted_date,
      f.created_at,
      f.updated_at
    FROM feed_records f
  `;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY f.date DESC, f.feed_id DESC`;

  const [rows] = await pool.execute(query, values);
  return rows.map(mapFeedRow);
}

async function getFeedRecordById(feedId, connection = pool) {
  const [rows] = await connection.execute(
    `
      SELECT
        f.feed_id,
        f.member_id,
        f.member_name,
        f.feed_type,
        f.quantity,
        f.rate,
        f.amount,
        f.remaining_amount,
        DATE_FORMAT(f.date, '%Y-%m-%d') AS date,
        f.status,
        f.last_deducted_amount,
        DATE_FORMAT(f.last_deducted_date, '%Y-%m-%d') AS last_deducted_date,
        f.created_at,
        f.updated_at
      FROM feed_records f
      WHERE f.feed_id = ?
      LIMIT 1
    `,
    [feedId]
  );

  return rows[0] ? mapFeedRow(rows[0]) : null;
}

async function createFeedRecord(data) {
  const memberId = cleanText(data.memberId);
  const memberName = cleanText(data.memberName);
  const feedType = cleanText(data.feedType);
  const quantity = toNumber(data.quantity);
  const rate = toNumber(data.rate);
  const amount = roundAmount(quantity * rate);
  const date = cleanText(data.date);
  const status = cleanText(data.status) || "Unpaid";

  if (!memberId || !memberName || !feedType || !date) {
    const error = new Error("Please fill all required feed fields");
    error.statusCode = 400;
    throw error;
  }

  if (quantity <= 0) {
    const error = new Error("Quantity must be greater than zero");
    error.statusCode = 400;
    throw error;
  }

  if (rate <= 0) {
    const error = new Error("Rate must be greater than zero");
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
      INSERT INTO feed_records (
        member_id,
        member_name,
        feed_type,
        quantity,
        rate,
        amount,
        remaining_amount,
        date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [memberId, memberName, feedType, quantity, rate, amount, amount, date, status]
  );

  return getFeedRecordById(result.insertId);
}

async function updateFeedRecord(feedId, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT * FROM feed_records WHERE feed_id = ? FOR UPDATE`,
      [feedId]
    );

    if (!rows.length) {
      const error = new Error("Feed record not found");
      error.statusCode = 404;
      throw error;
    }

    const old = rows[0];
    const quantity = data.quantity !== undefined ? toNumber(data.quantity) : toNumber(old.quantity);
    const rate = data.rate !== undefined ? toNumber(data.rate) : toNumber(old.rate);

    if (quantity <= 0) {
      const error = new Error("Quantity must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    if (rate <= 0) {
      const error = new Error("Rate must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    const amount = roundAmount(quantity * rate);
    const memberId = data.memberId !== undefined ? cleanText(data.memberId) : String(old.member_id);
    const memberName = data.memberName !== undefined ? cleanText(data.memberName) : old.member_name;
    const feedType = data.feedType !== undefined ? cleanText(data.feedType) : old.feed_type;
    const date = data.date !== undefined ? cleanText(data.date) : old.date;
    const status = data.status !== undefined ? cleanText(data.status) : old.status;

    if (!memberId || !memberName || !feedType || !date) {
      const error = new Error("Member, feed type and date are required");
      error.statusCode = 400;
      throw error;
    }

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

    // A manually edited feed amount cannot silently erase money already
    // recovered by a bill. Keep the existing recovered amount intact.
    const recovered = Math.max(toNumber(old.amount) - toNumber(old.remaining_amount), 0);
    const remaining = Math.max(roundAmount(amount - recovered), 0);

    let finalStatus = status;
    if (remaining === 0) finalStatus = "Deducted";
    else if (recovered > 0) finalStatus = "Partially Deducted";

    await connection.execute(
      `
        UPDATE feed_records
        SET
          member_id = ?,
          member_name = ?,
          feed_type = ?,
          quantity = ?,
          rate = ?,
          amount = ?,
          remaining_amount = ?,
          date = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE feed_id = ?
      `,
      [memberId, memberName, feedType, quantity, rate, amount, remaining, date, finalStatus, feedId]
    );

    await connection.commit();
    return getFeedRecordById(feedId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteFeedRecord(feedId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [allocations] = await connection.execute(
      `SELECT COUNT(*) AS count FROM bill_deduction_allocations WHERE source_type = 'Feed' AND source_record_id = ?`,
      [String(feedId)]
    );

    if (Number(allocations[0].count) > 0) {
      const error = new Error("Feed record cannot be deleted because it is linked to a bill deduction");
      error.statusCode = 409;
      throw error;
    }

    const record = await getFeedRecordById(feedId, connection);
    if (!record) {
      const error = new Error("Feed record not found");
      error.statusCode = 404;
      throw error;
    }

    await connection.execute(
      `DELETE FROM feed_records WHERE feed_id = ?`,
      [feedId]
    );

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
  getFeedRecords,
  getFeedRecordById,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
  mapFeedRow,
  roundAmount,
};
