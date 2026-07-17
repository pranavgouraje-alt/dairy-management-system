const bcrypt = require("bcryptjs");


const users = [
  {
    userId: "USER-1",
    name: "System Administrator",
    username: "admin",
    email: "admin@dairy.local",

    password: bcrypt.hashSync(
      "Admin@123",
      10
    ),

    role: "Admin",
    status: "Active",
    createdAt: new Date().toISOString(),
  },

  {
    userId: "USER-2",
    name: "Dairy Operator",
    username: "operator",
    email: "operator@dairy.local",

    password: bcrypt.hashSync(
      "Operator@123",
      10
    ),

    role: "Operator",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

module.exports = users;