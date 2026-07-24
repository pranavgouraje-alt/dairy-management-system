const {
  pool,
} = require("../config/db");


function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


function isValidMobile(mobile) {
  return /^\d{10}$/.test(mobile);
}


function isValidStatus(status) {
  return [
    "Active",
    "Inactive",
  ].includes(status);
}


function mapMember(row) {
  return {
    memberId: row.member_id,
    name: row.name,
    mobile: row.mobile,
    village: row.village || "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


async function getAllMembers(
  req,
  res
) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        member_id,
        name,
        mobile,
        village,
        status,
        created_at,
        updated_at
      FROM members
      ORDER BY
        CAST(member_id AS UNSIGNED),
        member_id
    `);

    const members = rows.map(mapMember);

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error(
      "Get members database error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load members from the database",
    });
  }
}


async function getMemberById(
  req,
  res
) {
  try {
    const memberId = cleanText(
      req.params.id
    );

    const [rows] = await pool.execute(
      `
        SELECT
          member_id,
          name,
          mobile,
          village,
          status,
          created_at,
          updated_at
        FROM members
        WHERE member_id = ?
        LIMIT 1
      `,
      [memberId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapMember(rows[0]),
    });
  } catch (error) {
    console.error(
      "Get member database error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the member",
    });
  }
}


async function createMember(
  req,
  res
) {
  try {
    const memberId = cleanText(
      req.body.memberId
    );

    const name = cleanText(
      req.body.name
    );

    const mobile = cleanText(
      req.body.mobile
    );

    const village = cleanText(
      req.body.village
    );

    const status =
      cleanText(req.body.status) ||
      "Active";

    if (
      !memberId ||
      !name ||
      !mobile
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID, member name and mobile number are required",
      });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number must contain exactly 10 digits",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Active or Inactive",
      });
    }

    const [existingMembers] =
      await pool.execute(
        `
          SELECT member_id
          FROM members
          WHERE member_id = ?
          LIMIT 1
        `,
        [memberId]
      );

    if (existingMembers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Member ID already exists",
      });
    }

    await pool.execute(
      `
        INSERT INTO members (
          member_id,
          name,
          mobile,
          village,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        memberId,
        name,
        mobile,
        village || null,
        status,
      ]
    );

    const [createdRows] =
      await pool.execute(
        `
          SELECT
            member_id,
            name,
            mobile,
            village,
            status,
            created_at,
            updated_at
          FROM members
          WHERE member_id = ?
          LIMIT 1
        `,
        [memberId]
      );

    return res.status(201).json({
      success: true,
      message:
        "Member added successfully",
      data: mapMember(createdRows[0]),
    });
  } catch (error) {
    console.error(
      "Create member database error:",
      error
    );

  
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Member ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to add the member",
    });
  }
}


async function updateMember(
  req,
  res
) {
  try {
    const memberId = cleanText(
      req.params.id
    );

    const name = cleanText(
      req.body.name
    );

    const mobile = cleanText(
      req.body.mobile
    );

    const village = cleanText(
      req.body.village
    );

    const status =
      cleanText(req.body.status) ||
      "Active";

    if (
      !name ||
      !mobile
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member name and mobile number are required",
      });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number must contain exactly 10 digits",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Active or Inactive",
      });
    }

  
    const [existingRows] =
      await pool.execute(
        `
          SELECT member_id
          FROM members
          WHERE member_id = ?
          LIMIT 1
        `,
        [memberId]
      );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    await pool.execute(
      `
        UPDATE members
        SET
          name = ?,
          mobile = ?,
          village = ?,
          status = ?
        WHERE member_id = ?
      `,
      [
        name,
        mobile,
        village || null,
        status,
        memberId,
      ]
    );

    const [updatedRows] =
      await pool.execute(
        `
          SELECT
            member_id,
            name,
            mobile,
            village,
            status,
            created_at,
            updated_at
          FROM members
          WHERE member_id = ?
          LIMIT 1
        `,
        [memberId]
      );

    return res.status(200).json({
      success: true,
      message:
        "Member updated successfully",
      data: mapMember(updatedRows[0]),
    });
  } catch (error) {
    console.error(
      "Update member database error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update the member",
    });
  }
}


async function deleteMember(
  req,
  res
) {
  try {
    const memberId = cleanText(
      req.params.id
    );

   
    const [existingRows] =
      await pool.execute(
        `
          SELECT
            member_id,
            name,
            mobile,
            village,
            status,
            created_at,
            updated_at
          FROM members
          WHERE member_id = ?
          LIMIT 1
        `,
        [memberId]
      );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    await pool.execute(
      `
        DELETE FROM members
        WHERE member_id = ?
      `,
      [memberId]
    );

    return res.status(200).json({
      success: true,
      message:
        "Member deleted successfully",
      data: mapMember(existingRows[0]),
    });
  } catch (error) {
    console.error(
      "Delete member database error:",
      error
    );

   
    if (
      error.code ===
      "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This member cannot be deleted because related records exist",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the member",
    });
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};