const jwt = require("jsonwebtoken");


function protect(req, res, next) {
  const authorizationHeader =
    req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication token is required",
    });
  }

  const token =
    authorizationHeader
      .slice(7)
      .trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication token is missing",
    });
  }

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET is missing"
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication configuration error",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      secret
    );

    req.user = {
      userId: String(
        decoded.userId
      ),
      username:
        decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your login session has expired. Please sign in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message:
        "Invalid authentication token",
    });
  }
}


function allowRoles(
  ...allowedRoles
) {
  return function checkRole(
    req,
    res,
    next
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication is required",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this operation",
      });
    }

    next();
  };
}

module.exports = {
  protect,
  allowRoles,
};