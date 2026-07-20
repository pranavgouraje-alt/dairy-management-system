const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");


function formatUser(user) {
  return {
    userId: String(user.user_id),
    name: user.name,
    username: user.username,
    email: user.email || "",
    role: user.role,
    status: user.status,
    lastLoginAt:
      user.last_login_at || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function createToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from the .env file"
    );
  }

  return jwt.sign(
    {
      userId: String(user.user_id),
      username: user.username,
      role: user.role,
    },
    secret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN ||
        "8h",
    }
  );
}


async function findUserForLogin(
  usernameOrEmail
) {
  const [rows] = await pool.execute(
    `
      SELECT
        user_id,
        name,
        username,
        email,
        password_hash,
        role,
        status,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE username = ?
         OR email = ?
      LIMIT 1
    `,
    [
      usernameOrEmail,
      usernameOrEmail,
    ]
  );

  return rows[0] || null;
}


async function login(req, res) {
  try {
    const {
      username,
      password,
    } = req.body;

    if (
      !username ||
      !String(username).trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required",
      });
    }

    const normalizedUsername =
      String(username)
        .trim()
        .toLowerCase();

    const user =
      await findUserForLogin(
        normalizedUsername
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Contact the administrator.",
      });
    }

    const passwordMatched =
      await bcrypt.compare(
        String(password),
        user.password_hash
      );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    await pool.execute(
      `
        UPDATE users
        SET last_login_at = NOW()
        WHERE user_id = ?
      `,
      [user.user_id]
    );

    user.last_login_at = new Date();

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error(
      "Login controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete login",
    });
  }
}

async function getCurrentUser(
  req,
  res
) {
  try {
    const [rows] = await pool.execute(
      `
        SELECT
          user_id,
          name,
          username,
          email,
          role,
          status,
          last_login_at,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [req.user.userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load current user",
    });
  }
}


async function getAllUsers(req, res) {
  try {
    const [users] =
      await pool.execute(
        `
          SELECT
            user_id,
            name,
            username,
            email,
            role,
            status,
            last_login_at,
            created_at,
            updated_at
          FROM users
          ORDER BY created_at DESC
        `
      );

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(formatUser),
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load users",
    });
  }
}

async function createUser(req, res) {
  try {
    const {
      name,
      username,
      email = "",
      password,
      role,
      status = "Active",
    } = req.body;

    if (
      !name ||
      !String(name).trim() ||
      !username ||
      !String(username).trim() ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, username, password and role are required",
      });
    }

    const normalizedUsername =
      String(username)
        .trim()
        .toLowerCase();

    const normalizedEmail = email
      ? String(email)
          .trim()
          .toLowerCase()
      : null;

    if (
      normalizedUsername.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must contain at least 3 characters",
      });
    }

    if (
      String(password).length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    const allowedRoles = [
      "Admin",
      "Operator",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Role must be Admin or Operator",
      });
    }

    const allowedStatuses = [
      "Active",
      "Inactive",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Active or Inactive",
      });
    }

    const duplicateParameters =
      normalizedEmail
        ? [
            normalizedUsername,
            normalizedEmail,
          ]
        : [
            normalizedUsername,
            "",
          ];

    const [existingUsers] =
      await pool.execute(
        `
          SELECT
            user_id,
            username,
            email
          FROM users
          WHERE username = ?
             OR (
               email IS NOT NULL
               AND email <> ''
               AND email = ?
             )
          LIMIT 1
        `,
        duplicateParameters
      );

    if (existingUsers.length > 0) {
      const existing =
        existingUsers[0];

      if (
        existing.username ===
        normalizedUsername
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Username already exists",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Email address already exists",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        String(password),
        10
      );

    const [result] =
      await pool.execute(
        `
          INSERT INTO users (
            name,
            username,
            email,
            password_hash,
            role,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          String(name).trim(),
          normalizedUsername,
          normalizedEmail,
          passwordHash,
          role,
          status,
        ]
      );

    const [createdRows] =
      await pool.execute(
        `
          SELECT
            user_id,
            name,
            username,
            email,
            role,
            status,
            last_login_at,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ?
          LIMIT 1
        `,
        [result.insertId]
      );

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",
      data: formatUser(
        createdRows[0]
      ),
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "Username or email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create user",
    });
  }
}


async function updateUserStatus(
  req,
  res
) {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (
      !["Active", "Inactive"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Active or Inactive",
      });
    }

    
    if (
      String(userId) ===
      String(req.user.userId) &&
      status === "Inactive"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot deactivate your own account",
      });
    }

    const [result] =
      await pool.execute(
        `
          UPDATE users
          SET status = ?
          WHERE user_id = ?
        `,
        [status, userId]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT
          user_id,
          name,
          username,
          email,
          role,
          status,
          last_login_at,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message:
        `User account marked as ${status}`,
      data: formatUser(rows[0]),
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update user status",
    });
  }
}

module.exports = {
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUserStatus,
};