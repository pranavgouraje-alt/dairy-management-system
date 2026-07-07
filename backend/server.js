console.log("THIS IS UPDATED SERVER.JS");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const memberRoutes = require("./routes/memberRoutes");
const collectionRoutes = require("./routes/collectionRoutes");

console.log("Collection routes loaded");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Dairy Management Backend is running...");
});

app.get("/api/test-collections", (req, res) => {
  res.json({
    success: true,
    message: "Test collection route working",
  });
});

app.use("/api/members", memberRoutes);
app.use("/api/collections", collectionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});