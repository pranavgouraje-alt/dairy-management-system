require("dotenv").config();

const bcrypt = require("bcryptjs");

const {
  pool,
  testDatabaseConnection,
  closeDatabasePool,
} = require("../config/db");

defaultUsers = [
  {
    name: "System Administrator",
    username: "admin",
    email: "admin@dairy.local",
    password: "Admin@123",
    role: "Admin",
    status: "Active",
  },
  {
    name: "Dairy Operator",
    username: "operator",
    email: "operator@dairy.local",
    password: "Operator@123",
    role: "Operator",
    status: "Active",
  },
];


async function findExistingUser(
  connection,
  username,
  email
) {
  const [rows] = await connection.execute(
    `
      SELECT
        user_id,
        username,
        email
      FROM users
      WHERE username = ?
         OR email = ?
      LIMIT 1
    `,
    [username, email]
  );

  return rows[0] || null;
}

async function seedUsers() {
  let connection;

  try {
    console.log(
      "Starting authentication user seed..."
    );

    await testDatabaseConnection();

    connection = await pool.getConnection();

    await connection.beginTransaction();

    for (const userData of defaultUsers) {
      const normalizedUsername =
        userData.username
          .trim()
          .toLowerCase();

      const normalizedEmail =
        userData.email
          .trim()
          .toLowerCase();

      const existingUser =
        await findExistingUser(
          connection,
          normalizedUsername,
          normalizedEmail
        );

      if (existingUser) {
        console.log(
          `Skipped existing user: ${normalizedUsername}`
        );

        continue;
      }

      const passwordHash =
        await bcrypt.hash(
          userData.password,
          10
        );

      const [result] =
        await connection.execute(
          `
            INSERT INTO users (
              name,
              username,
              email,
              password_hash,
              role,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            userData.name.trim(),
            normalizedUsername,
            normalizedEmail,
            passwordHash,
            userData.role,
            userData.status,
          ]
        );

      console.log(
        `Created ${userData.role}: ${normalizedUsername}`
      );

      console.log(
        `Inserted user ID: ${result.insertId}`
      );
    }

    await connection.commit();

    const [users] =
      await connection.execute(
        `
          SELECT
            user_id,
            name,
            username,
            email,
            role,
            status,
            created_at
          FROM users
          ORDER BY user_id ASC
        `
      );

    console.log(
      "\nCurrent authentication users:"
    );

    console.table(users);

    console.log(
      "\nUser seeding completed successfully"
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "User seeding failed:"
    );

    console.error(error.message);

    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await closeDatabasePool();
  }
}

seedUsers();