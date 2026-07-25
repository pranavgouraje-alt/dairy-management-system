const { pool } = require("../config/db");

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
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function isValidMilkType(milkType) {
  return [
    "Cow",
    "Buffalo",
  ].includes(milkType);
}

function mapRate(row) {
  return {
    id: String(row.rate_id),
    rateId: String(row.rate_id),
    milkType: row.milk_type,
    fat: Number(row.fat),
    snf: Number(row.snf),
    rate: Number(row.rate),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistory(row) {
  return {
    historyId: String(row.history_id),

    rateId:
      row.rate_id === null
        ? null
        : String(row.rate_id),

    action: row.action,
    milkType: row.milk_type,
    fat: Number(row.fat),
    snf: Number(row.snf),

    oldRate:
      row.old_rate === null
        ? "-"
        : Number(row.old_rate),

    newRate:
      row.new_rate === null
        ? "-"
        : Number(row.new_rate),

    changedDate: row.changed_date,
    changedTime: row.changed_time,
    changedBy: row.changed_by || "",
    createdAt: row.created_at,
  };
}

function getCurrentMysqlDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function getCurrentMysqlTime() {
  const now = new Date();

  const hours = String(
    now.getHours()
  ).padStart(2, "0");

  const minutes = String(
    now.getMinutes()
  ).padStart(2, "0");

  const seconds = String(
    now.getSeconds()
  ).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

async function addHistoryRecord(
  connection,
  {
    rateId,
    action,
    milkType,
    fat,
    snf,
    oldRate,
    newRate,
    changedBy,
  }
) {
  await connection.execute(
    `
      INSERT INTO rate_history (
        rate_id,
        action,
        milk_type,
        fat,
        snf,
        old_rate,
        new_rate,
        changed_date,
        changed_time,
        changed_by
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
        ?
      )
    `,
    [
      rateId,
      action,
      milkType,
      fat,
      snf,
      oldRate,
      newRate,
      getCurrentMysqlDate(),
      getCurrentMysqlTime(),
      changedBy || null,
    ]
  );
}

/*
  GET /api/rates
*/
async function getAllRates(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        rate_id,
        milk_type,
        fat,
        snf,
        rate,
        status,
        created_at,
        updated_at
      FROM rates
      ORDER BY
        FIELD(
          milk_type,
          'Cow',
          'Buffalo'
        ),
        fat ASC,
        snf ASC
    `);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRate),
    });
  } catch (error) {
    console.error(
      "Get rates error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load rates",
    });
  }
}

/*
  GET /api/rates/:id
*/
async function getRateById(req, res) {
  try {
    const rateId = cleanText(
      req.params.id
    );

    const [rows] = await pool.execute(
      `
        SELECT
          rate_id,
          milk_type,
          fat,
          snf,
          rate,
          status,
          created_at,
          updated_at
        FROM rates
        WHERE rate_id = ?
        LIMIT 1
      `,
      [rateId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapRate(rows[0]),
    });
  } catch (error) {
    console.error(
      "Get rate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load rate",
    });
  }
}

/*
  GET /api/rates/lookup?milkType=Cow&fat=4&snf=8.5
*/
async function lookupRate(req, res) {
  try {
    const milkType = cleanText(
      req.query.milkType
    );

    const fat = cleanNumber(
      req.query.fat
    );

    const snf = cleanNumber(
      req.query.snf
    );

    if (
      !milkType ||
      fat <= 0 ||
      snf <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type, FAT and SNF are required",
      });
    }

    if (!isValidMilkType(milkType)) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type must be Cow or Buffalo",
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT
          rate_id,
          milk_type,
          fat,
          snf,
          rate,
          status,
          created_at,
          updated_at
        FROM rates
        WHERE milk_type = ?
          AND fat = ?
          AND snf = ?
          AND status = 'Active'
        LIMIT 1
      `,
      [
        milkType,
        fat,
        snf,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No active rate found for the selected milk type, FAT and SNF",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: mapRate(rows[0]),
    });
  } catch (error) {
    console.error(
      "Rate lookup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to find matching rate",
    });
  }
}

/*
  POST /api/rates
*/
async function createRate(req, res) {
  let connection;

  try {
    const milkType = cleanText(
      req.body.milkType
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

    const changedBy = cleanText(
      req.body.changedBy
    );

    if (
      !milkType ||
      fat <= 0 ||
      snf <= 0 ||
      rate <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type, FAT, SNF and rate are required",
      });
    }

    if (!isValidMilkType(milkType)) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type must be Cow or Buffalo",
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [duplicateRows] =
      await connection.execute(
        `
          SELECT rate_id
          FROM rates
          WHERE milk_type = ?
            AND fat = ?
            AND snf = ?
          LIMIT 1
        `,
        [
          milkType,
          fat,
          snf,
        ]
      );

    if (duplicateRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "A rate already exists for this milk type, FAT and SNF",
      });
    }

    const [insertResult] =
      await connection.execute(
        `
          INSERT INTO rates (
            milk_type,
            fat,
            snf,
            rate,
            status
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            'Active'
          )
        `,
        [
          milkType,
          fat,
          snf,
          rate,
        ]
      );

    await addHistoryRecord(
      connection,
      {
        rateId:
          insertResult.insertId,

        action: "Created",
        milkType,
        fat,
        snf,
        oldRate: null,
        newRate: rate,
        changedBy,
      }
    );

    await connection.commit();

    const [createdRows] =
      await pool.execute(
        `
          SELECT
            rate_id,
            milk_type,
            fat,
            snf,
            rate,
            status,
            created_at,
            updated_at
          FROM rates
          WHERE rate_id = ?
          LIMIT 1
        `,
        [insertResult.insertId]
      );

    return res.status(201).json({
      success: true,
      message:
        "Rate created successfully",
      data: mapRate(createdRows[0]),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Create rate error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "A rate already exists for this milk type, FAT and SNF",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to create rate",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
  PUT /api/rates/:id
*/
async function updateRate(req, res) {
  let connection;

  try {
    const rateId = cleanText(
      req.params.id
    );

    const milkType = cleanText(
      req.body.milkType
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

    const status =
      cleanText(req.body.status) ||
      "Active";

    const changedBy = cleanText(
      req.body.changedBy
    );

    if (
      !milkType ||
      fat <= 0 ||
      snf <= 0 ||
      rate <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type, FAT, SNF and rate are required",
      });
    }

    if (!isValidMilkType(milkType)) {
      return res.status(400).json({
        success: false,
        message:
          "Milk type must be Cow or Buffalo",
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [existingRows] =
      await connection.execute(
        `
          SELECT
            rate_id,
            milk_type,
            fat,
            snf,
            rate,
            status
          FROM rates
          WHERE rate_id = ?
          LIMIT 1
        `,
        [rateId]
      );

    if (existingRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Rate not found",
      });
    }

    const oldRateRecord =
      existingRows[0];

    const [duplicateRows] =
      await connection.execute(
        `
          SELECT rate_id
          FROM rates
          WHERE milk_type = ?
            AND fat = ?
            AND snf = ?
            AND rate_id <> ?
          LIMIT 1
        `,
        [
          milkType,
          fat,
          snf,
          rateId,
        ]
      );

    if (duplicateRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Another rate already exists for this milk type, FAT and SNF",
      });
    }

    await connection.execute(
      `
        UPDATE rates
        SET
          milk_type = ?,
          fat = ?,
          snf = ?,
          rate = ?,
          status = ?
        WHERE rate_id = ?
      `,
      [
        milkType,
        fat,
        snf,
        rate,
        status,
        rateId,
      ]
    );

    await addHistoryRecord(
      connection,
      {
        rateId,
        action: "Updated",
        milkType,
        fat,
        snf,
        oldRate:
          Number(
            oldRateRecord.rate
          ),
        newRate: rate,
        changedBy,
      }
    );

    await connection.commit();

    const [updatedRows] =
      await pool.execute(
        `
          SELECT
            rate_id,
            milk_type,
            fat,
            snf,
            rate,
            status,
            created_at,
            updated_at
          FROM rates
          WHERE rate_id = ?
          LIMIT 1
        `,
        [rateId]
      );

    return res.status(200).json({
      success: true,
      message:
        "Rate updated successfully",
      data: mapRate(updatedRows[0]),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Update rate error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Another rate already exists for this milk type, FAT and SNF",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to update rate",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
  DELETE /api/rates/:id
*/
async function deleteRate(req, res) {
  let connection;

  try {
    const rateId = cleanText(
      req.params.id
    );

    const changedBy = cleanText(
      req.body?.changedBy
    );

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [existingRows] =
      await connection.execute(
        `
          SELECT
            rate_id,
            milk_type,
            fat,
            snf,
            rate,
            status
          FROM rates
          WHERE rate_id = ?
          LIMIT 1
        `,
        [rateId]
      );

    if (existingRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Rate not found",
      });
    }

    const oldRateRecord =
      existingRows[0];

    await addHistoryRecord(
      connection,
      {
        rateId,
        action: "Deleted",

        milkType:
          oldRateRecord.milk_type,

        fat:
          Number(oldRateRecord.fat),

        snf:
          Number(oldRateRecord.snf),

        oldRate:
          Number(
            oldRateRecord.rate
          ),

        newRate: null,
        changedBy,
      }
    );

    await connection.execute(
      `
        DELETE FROM rates
        WHERE rate_id = ?
      `,
      [rateId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Rate deleted successfully",
      data: mapRate(oldRateRecord),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Delete rate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to delete rate",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
  GET /api/rates/history/all
*/
async function getRateHistory(
  req,
  res
) {
  try {
    const fromDate = cleanText(
      req.query.fromDate
    );

    const toDate = cleanText(
      req.query.toDate
    );

    const milkType = cleanText(
      req.query.milkType
    );

    const conditions = [];
    const values = [];

    if (fromDate) {
      conditions.push(
        "changed_date >= ?"
      );

      values.push(fromDate);
    }

    if (toDate) {
      conditions.push(
        "changed_date <= ?"
      );

      values.push(toDate);
    }

    if (milkType) {
      conditions.push(
        "milk_type = ?"
      );

      values.push(milkType);
    }

    let query = `
      SELECT
        history_id,
        rate_id,
        action,
        milk_type,
        fat,
        snf,
        old_rate,
        new_rate,

        DATE_FORMAT(
          changed_date,
          '%Y-%m-%d'
        ) AS changed_date,

        TIME_FORMAT(
          changed_time,
          '%h:%i:%s %p'
        ) AS changed_time,

        changed_by,
        created_at

      FROM rate_history
    `;

    if (conditions.length > 0) {
      query += `
        WHERE ${conditions.join(
          " AND "
        )}
      `;
    }

    query += `
      ORDER BY
        changed_date DESC,
        changed_time DESC,
        history_id DESC
    `;

    const [rows] =
      await pool.execute(
        query,
        values
      );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapHistory),
    });
  } catch (error) {
    console.error(
      "Get rate history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.sqlMessage ||
        error.message ||
        "Unable to load rate history",
    });
  }
}

module.exports = {
  getAllRates,
  getRateById,
  lookupRate,
  createRate,
  updateRate,
  deleteRate,
  getRateHistory,
};