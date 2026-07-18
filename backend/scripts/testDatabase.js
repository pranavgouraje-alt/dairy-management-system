require("dotenv").config();

const {
  pool,
  testDatabaseConnection,
  closeDatabasePool,
} = require("../config/db");

async function runDatabaseTest() {
  try {
    console.log(
      "Starting MySQL database test..."
    );

    await testDatabaseConnection();

    const [databaseRows] =
      await pool.execute(
        "SELECT DATABASE() AS database_name"
      );

    console.log(
      "Selected database:",
      databaseRows[0].database_name
    );

   
    const [tableRows] =
      await pool.query("SHOW TABLES");

    const tableNames = tableRows.map(
      (row) => Object.values(row)[0]
    );

    console.log(
      `Total tables found: ${tableNames.length}`
    );

    console.log(
      "Database tables:"
    );

    tableNames.forEach(
      (tableName, index) => {
        console.log(
          `${index + 1}. ${tableName}`
        );
      }
    );

    const requiredTables = [
      "users",
      "members",
      "rates",
      "rate_history",
      "collections",
      "feed_records",
      "advance_records",
      "bills",
      "bill_collection_items",
      "bill_feed_deductions",
      "bill_advance_deductions",
      "payments",
      "reserve_records",
      "audit_logs",
    ];

    const missingTables =
      requiredTables.filter(
        (requiredTable) =>
          !tableNames.includes(
            requiredTable
          )
      );

    if (missingTables.length > 0) {
      console.warn(
        "Missing tables:"
      );

      missingTables.forEach(
        (tableName) => {
          console.warn(
            `- ${tableName}`
          );
        }
      );

      process.exitCode = 1;
    } else {
      console.log(
        "All required tables are available"
      );
    }
  } catch (error) {
    console.error(
      "Database test failed:"
    );

    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

runDatabaseTest();