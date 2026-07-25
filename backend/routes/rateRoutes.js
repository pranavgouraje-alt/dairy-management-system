const express = require("express");

const {
  getAllRates,
  getRateById,
  lookupRate,
  createRate,
  updateRate,
  deleteRate,
  getRateHistory,
} = require(
  "../controllers/rateController"
);

const router = express.Router();

/*
  GET /api/rates
*/
router.get(
  "/",
  getAllRates
);

/*
  Must appear before /:id.
*/
router.get(
  "/lookup",
  lookupRate
);

router.get(
  "/history/all",
  getRateHistory
);

/*
  GET /api/rates/:id
*/
router.get(
  "/:id",
  getRateById
);


router.post(
  "/",
  createRate
);


router.put(
  "/:id",
  updateRate
);


router.delete(
  "/:id",
  deleteRate
);

module.exports = router;