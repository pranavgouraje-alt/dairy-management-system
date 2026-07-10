const express = require("express");
const cors = require("cors");
require("dotenv").config();

const memberRoutes = require("./routes/memberRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const rateRoutes = require("./routes/rateRoutes");
const feedRoutes = require("./routes/feedRoutes");
const advanceRoutes = require("./routes/advanceRoutes");

const app = express();

/*
  Allows the React frontend to access the backend.
*/
app.use(cors());

/*
  Allows Express to read JSON request bodies.
*/
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Dairy Management Backend is running...");
});

/*
  API route registrations
*/
app.use("/api/members", memberRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/advance", advanceRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});