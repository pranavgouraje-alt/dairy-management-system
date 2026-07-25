const { pool } = require("../config/db");

/*
  Convert a value to clean text.
*/
function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

/*
  Convert a value to a valid number.
*/
function cleanNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

/*
  Validate milk type.
*/
function isValidMilkType(milkType) {
  return ["Cow", "Buffalo"].includes(milkType);
}

/*
  Validate collection session.
*/
function isValidSession(session) {
  return ["Morning", "Evening"].includes(session);
}

/*
  Generate MySQL TIME value.

  Example:
  18:35:10
*/
function getCurrentMysqlTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

/*
  Convert database row field names into
  frontend-compatible field names.
*/
function mapCollection(row) {
  return {
    collectionId: String(row.collection_id),
    memberId: String(row.member_id),
    memberName: row.member_name || "",
    collectionDate: row.collection_date,
    collectionTime: row.collection_time,
    milkType: row.milk_type,
    session: row.session,
    quantity: Number(row.quantity),
    fat: Number(row.fat),
    snf: Number(row.snf),
    rate: Number(row.rate),
    amount: Number(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/*
  The member name comes from the members table.

  The collections table does not need a
  separate member_name column.
*/
const collectionSelectQuery = `
  SELECT
    c.collection_id,
    c.member_id,
    m.name AS member_name,

    DATE_FORMAT(
      c.collection_date,
      '%Y-%m-%d'
    ) AS collection_date,

    TIME_FORMAT(
      c.collection_time,
      '%H:%i:%s'
    ) AS collection_time,

    c.milk_type,
    c.session,
    c.quantity,
    c.fat,
    c.snf,
    c.rate,
    c.amount,
    c.created_at,
    c.updated_at

  FROM collections c

  INNER JOIN members m
    ON m.member_id = c.member_id
`;

/*
  GET /api/collections

  Optional filters:
  memberId
  collectionDate
  milkType
  session
  fromDate
  toDate
*/
async function getAllCollections(req, res) {
  try {
    const {
      memberId,
      collectionDate,
      milkType,
      session,
      fromDate,
      toDate,
    } = req.query;

    const conditions = [];
    const parameters = [];

    if (memberId) {
      conditions.push("c.member_id = ?");
      parameters.push(cleanText(memberId));
    }

    if (collectionDate) {
      conditions.push("c.collection_date = ?");
      parameters.push(cleanText(collectionDate));
    }

    if (milkType) {
      conditions.push("c.milk_type = ?");
      parameters.push(cleanText(milkType));
    }

    if (session) {
      conditions.push("c.session = ?");
      parameters.push(cleanText(session));
    }

    if (fromDate) {
      conditions.push("c.collection_date >= ?");
      parameters.push(cleanText(fromDate));
    }

    if (toDate) {
      conditions.push("c.collection_date <= ?");
      parameters.push(cleanText(toDate));
    }

    let query = collectionSelectQuery;

    if (conditions.length > 0) {
      query += `
        WHERE ${conditions.join(" AND ")}
      `;
    }

    query += `
      ORDER BY
        c.collection_date DESC,

        FIELD(
          c.session,
          'Morning',
          'Evening'
        ),

        c.collection_time DESC,
        c.collection_id DESC
    `;

    const [rows] = await pool.execute(
      query,
      parameters
    );

    const collections = rows.map(mapCollection);

    return res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (error) {
    console.error(
      "Get collections error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load collections",
    });
  }
}

/*
  GET /api/collections/:id
*/
async function getCollectionById(req, res) {
  try {
    const collectionId = cleanText(req.params.id);

    const [rows] = await pool.execute(
      `
        ${collectionSelectQuery}

        WHERE c.collection_id = ?

        LIMIT 1
      `,
      [collectionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapCollection(rows[0]),
    });
  } catch (error) {
    console.error(
      "Get collection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load collection",
    });
  }
}

/*
  POST /api/collections
*/
async function createCollection(req, res) {
  try {
    const memberId = cleanText(
      req.body.memberId
    );

    const collectionDate = cleanText(
      req.body.collectionDate
    );

    const milkType = cleanText(
      req.body.milkType
    );

    const session = cleanText(
      req.body.session
    );

    const quantity = cleanNumber(
      req.body.quantity
    );

    const fat = cleanNumber(
      req.body.fat
    );

    const snf = cleanNumber(
      req.body.snf
    );

    const rate = cleanNumber(
      req.body.rate
    );

    /*
      Always create the collection time
      on the backend in MySQL format.
    */
    const collectionTime =
      getCurrentMysqlTime();

    /*
      Recalculate amount on the backend.
    */
    const amount = Number(
      (quantity * rate).toFixed(2)
    );

    if (
      !memberId ||
      !collectionDate ||
      !milkType ||
      !session
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member, date, milk type and session are required",
      });
    }

    if (!isValidMilkType(milkType)) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type must be Cow or Buffalo",
      });
    }

    if (!isValidSession(session)) {
      return res.status(400).json({
        success: false,
        message:
          "Session must be Morning or Evening",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than zero",
      });
    }

    if (fat <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "FAT must be greater than zero",
      });
    }

    if (snf <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "SNF must be greater than zero",
      });
    }

    if (rate <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Rate must be greater than zero",
      });
    }

    /*
      Confirm that member exists.
    */
    const [memberRows] = await pool.execute(
      `
        SELECT
          member_id,
          name,
          status

        FROM members

        WHERE member_id = ?

        LIMIT 1
      `,
      [memberId]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Selected member does not exist",
      });
    }

    if (memberRows[0].status !== "Active") {
      return res.status(400).json({
        success: false,
        message:
          "Collection cannot be added for an inactive member",
      });
    }

    /*
      Prevent duplicate collection.

      Duplicate means:
      same member
      same date
      same session
      same milk type
    */
    const [duplicateRows] = await pool.execute(
      `
        SELECT collection_id

        FROM collections

        WHERE member_id = ?
          AND collection_date = ?
          AND session = ?
          AND milk_type = ?

        LIMIT 1
      `,
      [
        memberId,
        collectionDate,
        session,
        milkType,
      ]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Collection already exists for this member, date, session and milk type",
      });
    }

    /*
      10 columns
      10 placeholders
      10 values
    */
    const [insertResult] = await pool.execute(
      `
        INSERT INTO collections (
          member_id,
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        memberId,
        collectionDate,
        collectionTime,
        milkType,
        session,
        quantity,
        fat,
        snf,
        rate,
        amount,
      ]
    );

    const collectionId =
      insertResult.insertId;

    const [createdRows] = await pool.execute(
      `
        ${collectionSelectQuery}

        WHERE c.collection_id = ?

        LIMIT 1
      `,
      [collectionId]
    );

    return res.status(201).json({
      success: true,
      message:
        "Collection saved successfully",
      data: mapCollection(createdRows[0]),
    });
  } catch (error) {
    console.error(
      "Create collection error:",
      {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
      }
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Collection already exists for this member, date, session and milk type",
      });
    }

    if (
      error.code ===
      "ER_NO_REFERENCED_ROW_2"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected member does not exist in the members table",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to save collection",
      code: error.code || "",
    });
  }
}

/*
  PUT /api/collections/:id
*/
async function updateCollection(req, res) {
  try {
    const collectionId = cleanText(
      req.params.id
    );

    const [existingRows] =
      await pool.execute(
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

          WHERE collection_id = ?

          LIMIT 1
        `,
        [collectionId]
      );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const existing = existingRows[0];

    const memberId = cleanText(
      req.body.memberId ??
        existing.member_id
    );

    const collectionDate = cleanText(
      req.body.collectionDate ??
        existing.collection_date
    );

    const collectionTime =
      existing.collection_time ||
      getCurrentMysqlTime();

    const milkType = cleanText(
      req.body.milkType ??
        existing.milk_type
    );

    const session = cleanText(
      req.body.session ??
        existing.session
    );

    const quantity = cleanNumber(
      req.body.quantity ??
        existing.quantity
    );

    const fat = cleanNumber(
      req.body.fat ??
        existing.fat
    );

    const snf = cleanNumber(
      req.body.snf ??
        existing.snf
    );

    const rate = cleanNumber(
      req.body.rate ??
        existing.rate
    );

    const amount = Number(
      (quantity * rate).toFixed(2)
    );

    if (
      !memberId ||
      !collectionDate ||
      !milkType ||
      !session
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member, date, milk type and session are required",
      });
    }

    if (!isValidMilkType(milkType)) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type must be Cow or Buffalo",
      });
    }

    if (!isValidSession(session)) {
      return res.status(400).json({
        success: false,
        message:
          "Session must be Morning or Evening",
      });
    }

    if (
      quantity <= 0 ||
      fat <= 0 ||
      snf <= 0 ||
      rate <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity, FAT, SNF and rate must be greater than zero",
      });
    }

    const [memberRows] = await pool.execute(
      `
        SELECT
          member_id,
          status

        FROM members

        WHERE member_id = ?

        LIMIT 1
      `,
      [memberId]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Selected member does not exist",
      });
    }

    if (memberRows[0].status !== "Active") {
      return res.status(400).json({
        success: false,
        message:
          "Collection cannot be updated for an inactive member",
      });
    }

    const [duplicateRows] = await pool.execute(
      `
        SELECT collection_id

        FROM collections

        WHERE member_id = ?
          AND collection_date = ?
          AND session = ?
          AND milk_type = ?
          AND collection_id <> ?

        LIMIT 1
      `,
      [
        memberId,
        collectionDate,
        session,
        milkType,
        collectionId,
      ]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Another collection already exists for this member, date, session and milk type",
      });
    }

    await pool.execute(
      `
        UPDATE collections

        SET
          member_id = ?,
          collection_date = ?,
          collection_time = ?,
          milk_type = ?,
          session = ?,
          quantity = ?,
          fat = ?,
          snf = ?,
          rate = ?,
          amount = ?

        WHERE collection_id = ?
      `,
      [
        memberId,
        collectionDate,
        collectionTime,
        milkType,
        session,
        quantity,
        fat,
        snf,
        rate,
        amount,
        collectionId,
      ]
    );

    const [updatedRows] = await pool.execute(
      `
        ${collectionSelectQuery}

        WHERE c.collection_id = ?

        LIMIT 1
      `,
      [collectionId]
    );

    return res.status(200).json({
      success: true,
      message:
        "Collection updated successfully",
      data: mapCollection(updatedRows[0]),
    });
  } catch (error) {
    console.error(
      "Update collection error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Another collection already exists for this member, date, session and milk type",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to update collection",
    });
  }
}

/*
  DELETE /api/collections/:id
*/
async function deleteCollection(req, res) {
  try {
    const collectionId = cleanText(
      req.params.id
    );

    const [existingRows] =
      await pool.execute(
        `
          ${collectionSelectQuery}

          WHERE c.collection_id = ?

          LIMIT 1
        `,
        [collectionId]
      );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    await pool.execute(
      `
        DELETE FROM collections
        WHERE collection_id = ?
      `,
      [collectionId]
    );

    return res.status(200).json({
      success: true,
      message:
        "Collection deleted successfully",
      data: mapCollection(existingRows[0]),
    });
  } catch (error) {
    console.error(
      "Delete collection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to delete collection",
    });
  }
}

module.exports = {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};