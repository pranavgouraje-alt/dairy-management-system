const collections = require("../data/collectionsData");

function getAllCollections(req, res) {
  res.status(200).json({
    success: true,
    count: collections.length,
    data: collections,
  });
}

function createCollection(req, res) {
  const {
    memberId,
    memberName,
    collectionDate,
    collectionTime,
    milkType,
    session,
    quantity,
    fat,
    snf,
    rate,
    amount,
  } = req.body;

  if (
    !memberId ||
    !memberName ||
    !collectionDate ||
    !milkType ||
    !session ||
    !quantity ||
    !fat ||
    !snf ||
    !rate
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required collection fields",
    });
  }

  const duplicate = collections.find(
    (item) =>
      item.memberId === memberId &&
      item.collectionDate === collectionDate &&
      item.session === session &&
      item.milkType === milkType
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message:
        "Collection already exists for this member, date, session and milk type",
    });
  }

  const newCollection = {
    collectionId: Date.now().toString(),
    memberId,
    memberName,
    collectionDate,
    collectionTime:
      collectionTime || new Date().toLocaleTimeString(),
    milkType,
    session,
    quantity: Number(quantity),
    fat: Number(fat),
    snf: Number(snf),
    rate: Number(rate),
    amount: Number(amount),
  };

  collections.push(newCollection);

  res.status(201).json({
    success: true,
    message: "Collection saved successfully",
    data: newCollection,
  });
}

function updateCollection(req, res) {
  const collectionId = req.params.id;

  const index = collections.findIndex(
    (item) => item.collectionId === collectionId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  const updatedCollection = {
    ...collections[index],
    ...req.body,
    collectionId,
    quantity: Number(req.body.quantity ?? collections[index].quantity),
    fat: Number(req.body.fat ?? collections[index].fat),
    snf: Number(req.body.snf ?? collections[index].snf),
    rate: Number(req.body.rate ?? collections[index].rate),
    amount: Number(req.body.amount ?? collections[index].amount),
  };

  collections[index] = updatedCollection;

  res.status(200).json({
    success: true,
    message: "Collection updated successfully",
    data: updatedCollection,
  });
}

function deleteCollection(req, res) {
  const collectionId = req.params.id;

  const index = collections.findIndex(
    (item) => item.collectionId === collectionId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Collection not found",
    });
  }

  const deletedCollection = collections.splice(index, 1);

  res.status(200).json({
    success: true,
    message: "Collection deleted successfully",
    data: deletedCollection[0],
  });
}

module.exports = {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};