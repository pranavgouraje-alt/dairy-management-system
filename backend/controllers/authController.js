const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = require("../data/usersData");

function sanitizeUser(user) {
  return {
    userId: user.userId,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}


function createToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn:
        process.env.JWT_EXPIRES_IN ||
        "8h",
    }
  );
}

async function login(req, res) {
  try {
    const { username, password } =
      req.body;

    if (!username || !password) {
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

    const user = users.find(
      (item) =>
        item.username.toLowerCase() ===
          normalizedUsername ||
        item.email.toLowerCase() ===
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
        password,
        user.password
      );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete login",
    });
  }
}


function getCurrentUser(req, res) {
  const user = users.find(
    (item) =>
      item.userId === req.user.userId
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User account not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: sanitizeUser(user),
  });
}


function getAllUsers(req, res) {
  const safeUsers = users.map(
    sanitizeUser
  );

  return res.status(200).json({
    success: true,
    count: safeUsers.length,
    data: safeUsers,
  });
}



async function createUser(req, res) {
  try {
    const {
      name,
      username,
      email,
      password,
      role,
      status,
    } = req.body;

    if (
      !name ||
      !username ||
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

    const duplicate = users.find(
      (item) =>
        item.username.toLowerCase() ===
        normalizedUsername
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "Username already exists",
      });
    }

    if (
      !["Admin", "Operator"].includes(
        role
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Role must be Admin or Operator",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const newUser = {
      userId: `USER-${Date.now()}`,
      name: String(name).trim(),
      username: normalizedUsername,
      email: email
        ? String(email)
            .trim()
            .toLowerCase()
        : "",
      password: hashedPassword,
      role,
      status: status || "Active",
      createdAt:
        new Date().toISOString(),
    };

    users.push(newUser);

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",
      data: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
}

module.exports = {
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
};