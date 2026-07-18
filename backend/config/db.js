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
    "dairy_management",

  
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
      "SELECT 1 AS connection_test"
    );

    console.log(
      "MySQL database connected successfully"
    );

    console.log(
      `Database: ${
        process.env.DB_NAME ||
        "dairy_management"
      }`
    );

    console.log(
      `MySQL server: ${
        process.env.DB_HOST ||
        "localhost"
      }:${
        process.env.DB_PORT || 3306
      }`
    );

    return true;
  } catch (error) {
    console.error(
      "MySQL connection failed:"
    );

    console.error(error.message);

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function closeDatabasePool() {
  try {
    await pool.end();

    console.log(
      "MySQL connection pool closed"
    );
  } catch (error) {
    console.error(
      "Error closing MySQL pool:",
      error.message
    );
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
  closeDatabasePool,
};