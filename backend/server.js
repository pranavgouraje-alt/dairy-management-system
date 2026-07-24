const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  testDatabaseConnection,
} = require("./config/db");

const authRoutes = require(
  "./routes/authRoutes"
);

const memberRoutes = require(
  "./routes/memberRoutes"
);

const collectionRoutes = require(
  "./routes/collectionRoutes"
);

const rateRoutes = require(
  "./routes/rateRoutes"
);

const feedRoutes = require(
  "./routes/feedRoutes"
);

const advanceRoutes = require(
  "./routes/advanceRoutes"
);

const billRoutes = require(
  "./routes/billRoutes"
);

const reportRoutes = require(
  "./routes/reportRoutes"
);

const notificationRoutes = require(
  "./routes/notificationRoutes"
);

const {
  activityLogger,
} = require(
  "./middleware/activityLogger"
);

const app = express();


app.use(
  cors({
    origin:
      "http://localhost:5173",

    credentials: true,
  })
);


app.use(express.json());


app.use(activityLogger);


app.get("/", (req, res) => {
  res.status(200).send(
    "Dairy Management Backend is running..."
  );
});


app.get(
  "/api/health/database",
  async (req, res) => {
    try {
      const {
        pool,
      } = require("./config/db");

      const [rows] =
        await pool.execute(
          "SELECT NOW() AS serverTime"
        );

      return res.status(200).json({
        success: true,
        message:
          "MySQL database is connected",
        data: {
          serverTime:
            rows[0].serverTime,
        },
      });
    } catch (error) {
      console.error(
        "Database health error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "MySQL database connection failed",
      });
    }
  }
);


app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/members",
  memberRoutes
);

app.use(
  "/api/collections",
  collectionRoutes
);

app.use(
  "/api/rates",
  rateRoutes
);

app.use(
  "/api/feed",
  feedRoutes
);

app.use(
  "/api/advances",
  advanceRoutes
);

app.use(
  "/api/bills",
  billRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);


app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,

    message:
      `API route not found: ${req.method} ${req.originalUrl}`,
  });
});


app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal backend server error",
    });
  }
);

const PORT = Number(
  process.env.PORT || 5001
);


async function startServer() {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Backend URL: http://localhost:${PORT}`
    );
  });
}

startServer();