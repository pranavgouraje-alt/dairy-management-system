const mysql = require("mysql2/promise");


const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",

  port: Number(
    process.env.DB_PORT || 3306
  ),

  user: process.env.DB_USER || "root",

  password:
    process.env.DB_PASSWORD || "",

  database:
    process.env.DB_NAME ||
    "dairy_management_system",

  waitForConnections: true,

  connectionLimit: Number(
    process.env.DB_CONNECTION_LIMIT || 10
  ),

  queueLimit: 0,


  decimalNumbers: true,

  charset: "utf8mb4",
});

async function testDatabaseConnection() {
  let connection;

  try {
    connection =
      await pool.getConnection();

    await connection.query(
      "SELECT 1 AS database_test"
    );

    console.log(
      "MySQL database connected successfully"
    );

    return true;
  } catch (error) {
    console.error(
      "MySQL connection failed:",
      error.message
    );

    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};