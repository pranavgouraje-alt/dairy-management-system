const express = require("express");

const {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/collectionController");

const router = express.Router();

router.get("/", getAllCollections);
router.post("/", createCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

module.exports = router;