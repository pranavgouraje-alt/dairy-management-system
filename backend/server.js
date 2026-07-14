const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    "Dairy Management Backend is running..."
  );
});

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

const PORT =
  process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});