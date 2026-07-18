const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  pool,
  testDatabaseConnection,
  closeDatabasePool,
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

const app = express();


app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(express.json());


app.use(
  express.urlencoded({
    extended: true,
  })
);


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Dairy Management Backend is running",
    database: "MySQL",
  });
});


app.get(
  "/api/health/database",
  async (req, res) => {
    try {
      const [rows] =
        await pool.execute(`
          SELECT
            DATABASE() AS databaseName,
            NOW() AS serverTime,
            VERSION() AS mysqlVersion
        `);

      const [tableRows] =
        await pool.query(
          "SHOW TABLES"
        );

      res.status(200).json({
        success: true,

        message:
          "MySQL database connection is healthy",

        data: {
          database:
            rows[0].databaseName,

          serverTime:
            rows[0].serverTime,

          mysqlVersion:
            rows[0].mysqlVersion,

          totalTables:
            tableRows.length,
        },
      });
    } catch (error) {
      console.error(
        "Database health check failed:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "MySQL database connection failed",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);

app.use("/api/auth", authRoutes);

app.use(
  "/api/members",
  memberRoutes
);

app.use(
  "/api/collections",
  collectionRoutes
);

app.use("/api/rates", rateRoutes);

app.use("/api/feed", feedRoutes);

app.use(
  "/api/advances",
  advanceRoutes
);

app.use("/api/bills", billRoutes);

app.use(
  "/api/reports",
  reportRoutes
);


app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,

    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});


app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled backend error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Internal backend server error",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
);

const PORT = Number(
  process.env.PORT || 5001
);

let server;


async function startServer() {
  try {
    await testDatabaseConnection();

    server = app.listen(
      PORT,
      () => {
        console.log(
          `Backend server running on port ${PORT}`
        );

        console.log(
          `Frontend allowed from: ${
            process.env.FRONTEND_URL ||
            "http://localhost:5173"
          }`
        );

        console.log(
          `Database health URL: http://localhost:${PORT}/api/health/database`
        );
      }
    );
  } catch (error) {
    console.error(
      "Backend could not start because MySQL is unavailable"
    );

    console.error(
      "Check your MySQL server and .env configuration"
    );

    process.exit(1);
  }
}


async function shutdownServer(signal) {
  console.log(
    `\n${signal} received. Shutting down...`
  );

  if (server) {
    server.close(
      async () => {
        console.log(
          "Express server stopped"
        );

        await closeDatabasePool();

        process.exit(0);
      }
    );
  } else {
    await closeDatabasePool();

    process.exit(0);
  }
}

process.on(
  "SIGINT",
  () => shutdownServer("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdownServer("SIGTERM")
);

startServer();