const {
  notifications,
  activities,
} = require("../data/notificationData");


function safeText(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
}


function getModuleName(pathname = "") {
  const normalizedPath =
    pathname.toLowerCase();

  if (
    normalizedPath.includes("/auth")
  ) {
    return "Authentication";
  }

  if (
    normalizedPath.includes("/members")
  ) {
    return "Members";
  }

  if (
    normalizedPath.includes(
      "/collections"
    )
  ) {
    return "Collection";
  }

  if (
    normalizedPath.includes("/rates")
  ) {
    return "Rate Master";
  }

  if (
    normalizedPath.includes("/feed")
  ) {
    return "Feed";
  }

  if (
    normalizedPath.includes("/advances")
  ) {
    return "Advance";
  }

  if (
    normalizedPath.includes("/bills")
  ) {
    return "Billing";
  }

  if (
    normalizedPath.includes("/reports")
  ) {
    return "Reports";
  }

  if (
    normalizedPath.includes(
      "/notifications"
    )
  ) {
    return "Notifications";
  }

  return "System";
}


function getActionName(
  method,
  moduleName,
  pathname
) {
  if (
    moduleName === "Authentication" &&
    pathname.includes("/login")
  ) {
    return "User Login";
  }

  if (method === "POST") {
    if (moduleName === "Members") {
      return "Member Added";
    }

    if (moduleName === "Collection") {
      return "Collection Saved";
    }

    if (moduleName === "Rate Master") {
      return "Rate Added";
    }

    if (moduleName === "Feed") {
      return "Feed Record Added";
    }

    if (moduleName === "Advance") {
      return "Advance Added";
    }

    if (
      moduleName === "Billing" &&
      pathname.includes(
        "/generate-all"
      )
    ) {
      return "All Bills Generated";
    }

    if (
      moduleName === "Billing" &&
      pathname.includes("/generate")
    ) {
      return "Member Bill Generated";
    }

    return `${moduleName} Record Created`;
  }

  if (
    method === "PUT" ||
    method === "PATCH"
  ) {
    if (moduleName === "Members") {
      return "Member Updated";
    }

    if (moduleName === "Collection") {
      return "Collection Updated";
    }

    if (moduleName === "Rate Master") {
      return "Rate Updated";
    }

    if (moduleName === "Feed") {
      return "Feed Record Updated";
    }

    if (moduleName === "Advance") {
      return "Advance Updated";
    }

    return `${moduleName} Record Updated`;
  }

  if (method === "DELETE") {
    if (moduleName === "Members") {
      return "Member Deleted";
    }

    if (moduleName === "Collection") {
      return "Collection Deleted";
    }

    if (moduleName === "Rate Master") {
      return "Rate Deleted";
    }

    if (moduleName === "Feed") {
      return "Feed Record Deleted";
    }

    if (moduleName === "Advance") {
      return "Advance Deleted";
    }

    if (moduleName === "Billing") {
      return "Bill Deleted";
    }

    return `${moduleName} Record Deleted`;
  }

  return `${moduleName} Activity`;
}


function getNotificationType(method) {
  if (method === "DELETE") {
    return "warning";
  }

  if (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH"
  ) {
    return "success";
  }

  return "info";
}


function getPriority(
  method,
  moduleName
) {
  if (
    method === "DELETE" ||
    moduleName === "Billing"
  ) {
    return "High";
  }

  if (
    method === "PUT" ||
    method === "PATCH"
  ) {
    return "Medium";
  }

  return "Low";
}


function createDescription(
  actionName,
  req,
  responseBody
) {
  const body = req.body || {};

  const responseData =
    responseBody?.data || {};

  const memberId =
    body.memberId ||
    responseData.memberId ||
    "";

  const memberName =
    body.memberName ||
    body.name ||
    responseData.memberName ||
    responseData.name ||
    "";

  if (memberId || memberName) {
    const identity = [
      memberId,
      memberName,
    ]
      .filter(Boolean)
      .join(" - ");

    return `${actionName}: ${identity}`;
  }

  if (responseBody?.message) {
    return responseBody.message;
  }

  return `${actionName} completed successfully`;
}


function logActivity({
  title,
  description,
  moduleName,
  type = "info",
  priority = "Low",
  user = {},
  request = {},
  statusCode = 200,
}) {
  const now = new Date();

  const createdBy =
    user.name ||
    user.username ||
    user.userId ||
    "System";

  const notificationId =
    `NOT-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const activityId =
    `ACT-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const notification = {
    notificationId,
    title,
    description,
    module: moduleName,
    type,
    priority,
    read: false,
    createdBy,
    createdAt: now.toISOString(),
    createdDate:
      now.toISOString().split("T")[0],
    createdTime:
      now.toLocaleTimeString(),
  };

  const activity = {
    activityId,
    title,
    description,
    action: title,
    module: moduleName,
    type,
    priority,
    status:
      statusCode >= 200 &&
      statusCode < 300
        ? "Success"
        : "Failed",
    statusCode,
    userId: user.userId || "",
    username:
      user.username || createdBy,
    userRole: user.role || "",
    createdBy,
    method: request.method || "",
    path: request.path || "",
    ip: request.ip || "",
    userAgent:
      request.userAgent || "",
    createdAt: now.toISOString(),
    createdDate:
      now.toISOString().split("T")[0],
    createdTime:
      now.toLocaleTimeString(),
  };

  notifications.unshift(notification);
  activities.unshift(activity);

  if (notifications.length > 500) {
    notifications.length = 500;
  }

  if (activities.length > 1000) {
    activities.length = 1000;
  }

  return {
    notification,
    activity,
  };
}


function activityLogger(
  req,
  res,
  next
) {
  const method =
    req.method.toUpperCase();

  const writeMethods = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ];

  if (
    !writeMethods.includes(method)
  ) {
    return next();
  }


  if (
    req.originalUrl.startsWith(
      "/api/notifications"
    )
  ) {
    return next();
  }

  const originalJson =
    res.json.bind(res);

  res.json = function wrappedJson(
    responseBody
  ) {
    const successful =
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      responseBody?.success !== false;

    if (successful) {
      try {
        const moduleName =
          getModuleName(
            req.originalUrl
          );

        const actionName =
          getActionName(
            method,
            moduleName,
            req.originalUrl
          );

        logActivity({
          title: actionName,

          description:
            createDescription(
              actionName,
              req,
              responseBody
            ),

          moduleName,

          type:
            getNotificationType(method),

          priority:
            getPriority(
              method,
              moduleName
            ),

          user: req.user || {},

          request: {
            method,
            path: req.originalUrl,
            ip:
              req.ip ||
              req.socket
                ?.remoteAddress ||
              "",
            userAgent:
              req.headers[
                "user-agent"
              ] || "",
          },

          statusCode:
            res.statusCode,
        });
      } catch (error) {
        console.error(
          "Activity logging error:",
          error
        );
      }
    }

    return originalJson(responseBody);
  };

  next();
}

module.exports = {
  activityLogger,
  logActivity,
};