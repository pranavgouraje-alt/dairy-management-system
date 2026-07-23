const {
  notifications,
  activities,
} = require("../data/notificationData");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function getNotifications(req, res) {
  try {
    const {
      search,
      type,
      priority,
      read,
      limit,
    } = req.query;

    let records = [
      ...notifications,
    ];

    if (search) {
      const searchText =
        normalize(search);

      records = records.filter(
        (item) =>
          normalize(item.title).includes(
            searchText
          ) ||
          normalize(
            item.description
          ).includes(searchText) ||
          normalize(item.module).includes(
            searchText
          ) ||
          normalize(
            item.createdBy
          ).includes(searchText)
      );
    }

    if (type) {
      records = records.filter(
        (item) =>
          normalize(item.type) ===
          normalize(type)
      );
    }

    if (priority) {
      records = records.filter(
        (item) =>
          normalize(item.priority) ===
          normalize(priority)
      );
    }

    if (read === "true") {
      records = records.filter(
        (item) => item.read === true
      );
    }

    if (read === "false") {
      records = records.filter(
        (item) => item.read === false
      );
    }

    const maximumRecords =
      Number(limit);

    if (
      Number.isFinite(
        maximumRecords
      ) &&
      maximumRecords > 0
    ) {
      records = records.slice(
        0,
        maximumRecords
      );
    }

    const unreadCount =
      notifications.filter(
        (item) => !item.read
      ).length;

    res.status(200).json({
      success: true,
      count: records.length,
      unreadCount,
      data: records,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load notifications",
    });
  }
}


function createNotification(req, res) {
  try {
    const {
      title,
      description,
      module,
      type,
      priority,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Title and description are required",
      });
    }

    const now = new Date();

    const newNotification = {
      notificationId:
        `NOT-${Date.now()}`,

      title:
        String(title).trim(),

      description:
        String(
          description
        ).trim(),

      module:
        module || "System",

      type: type || "info",

      priority:
        priority || "Low",

      read: false,

      createdBy:
        req.user?.username ||
        req.user?.userId ||
        "System",

      createdAt:
        now.toISOString(),

      createdDate:
        now
          .toISOString()
          .split("T")[0],

      createdTime:
        now.toLocaleTimeString(),
    };

    notifications.unshift(
      newNotification
    );

    res.status(201).json({
      success: true,
      message:
        "Notification created successfully",
      data: newNotification,
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create notification",
    });
  }
}

function markNotificationRead(
  req,
  res
) {
  const notificationId =
    req.params.id;

  const notification =
    notifications.find(
      (item) =>
        item.notificationId ===
        notificationId
    );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message:
        "Notification not found",
    });
  }

  notification.read = true;
  notification.readAt =
    new Date().toISOString();

  res.status(200).json({
    success: true,
    message:
      "Notification marked as read",
    data: notification,
  });
}


function markAllNotificationsRead(
  req,
  res
) {
  const now =
    new Date().toISOString();

  notifications.forEach(
    (notification) => {
      notification.read = true;
      notification.readAt = now;
    }
  );

  res.status(200).json({
    success: true,
    message:
      "All notifications marked as read",
  });
}


function deleteNotification(req, res) {
  const notificationId =
    req.params.id;

  const index =
    notifications.findIndex(
      (item) =>
        item.notificationId ===
        notificationId
    );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message:
        "Notification not found",
    });
  }

  const deleted =
    notifications.splice(index, 1);

  res.status(200).json({
    success: true,
    message:
      "Notification deleted successfully",
    data: deleted[0],
  });
}


function clearAllNotifications(
  req,
  res
) {
  notifications.length = 0;

  res.status(200).json({
    success: true,
    message:
      "All notifications cleared",
  });
}


function getActivities(req, res) {
  try {
    const {
      search,
      module,
      status,
      type,
      fromDate,
      toDate,
      limit,
    } = req.query;

    let records = [...activities];

    if (search) {
      const searchText =
        normalize(search);

      records = records.filter(
        (item) =>
          normalize(item.title).includes(
            searchText
          ) ||
          normalize(
            item.description
          ).includes(searchText) ||
          normalize(item.module).includes(
            searchText
          ) ||
          normalize(
            item.createdBy
          ).includes(searchText)
      );
    }

    if (module) {
      records = records.filter(
        (item) =>
          normalize(item.module) ===
          normalize(module)
      );
    }

    if (status) {
      records = records.filter(
        (item) =>
          normalize(item.status) ===
          normalize(status)
      );
    }

    if (type) {
      records = records.filter(
        (item) =>
          normalize(item.type) ===
          normalize(type)
      );
    }

    if (fromDate) {
      records = records.filter(
        (item) =>
          item.createdDate >= fromDate
      );
    }

    if (toDate) {
      records = records.filter(
        (item) =>
          item.createdDate <= toDate
      );
    }

    const maximumRecords =
      Number(limit);

    if (
      Number.isFinite(
        maximumRecords
      ) &&
      maximumRecords > 0
    ) {
      records = records.slice(
        0,
        maximumRecords
      );
    }

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error(
      "Get activities error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load activity logs",
    });
  }
}


function clearActivities(req, res) {
  activities.length = 0;

  res.status(200).json({
    success: true,
    message:
      "Activity logs cleared successfully",
  });
}

module.exports = {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getActivities,
  clearActivities,
};