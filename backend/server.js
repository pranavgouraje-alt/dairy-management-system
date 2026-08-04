const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testDatabaseConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const rateRoutes = require("./routes/rateRoutes");
const feedRoutes = require("./routes/feedRoutes");
const advanceRoutes = require("./routes/advanceRoutes");
const billRoutes = require("./routes/billRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const billHistoryRoutes = require("./routes/billHistoryRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { activityLogger } = require("./middleware/activityLogger");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(activityLogger);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dairy Management Backend is running",
  });
});

app.get("/api/health/database", async (req, res) => {
  try {
    const { pool } = require("./config/db");
    const [rows] = await pool.execute(
      "SELECT NOW() AS serverTime, DATABASE() AS databaseName"
    );

    res.status(200).json({
      success: true,
      message: "MySQL database is connected",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "MySQL database connection failed",
    });
  }
});

/* Every valid route must be before the /api 404 middleware. */
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/advances", advanceRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bill-history", billHistoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.sqlMessage ||
      error.message ||
      "Internal backend server error",
  });
});

const PORT = Number(process.env.PORT || 5001);

async function startServer() {
  const connected = await testDatabaseConnection();

  if (!connected) {
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Backend URL: http://localhost:${PORT}`);
  });
}

startServer();
