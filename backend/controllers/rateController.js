const rateMaster = require("../data/rateData");

// GET all rates
function getAllRates(req, res) {
  res.status(200).json({
    success: true,
    count: rateMaster.length,
    data: rateMaster,
  });
}

// CREATE new rate
function createRate(req, res) {
  const { milkType, fat, snf, rate } = req.body;

  if (!milkType || !fat || !snf || !rate) {
    return res.status(400).json({
      success: false,
      message: "Please fill all rate fields",
    });
  }

  const duplicateRate = rateMaster.find(
    (item) =>
      item.milkType === milkType &&
      Number(item.fat) === Number(fat) &&
      Number(item.snf) === Number(snf)
  );

  if (duplicateRate) {
    return res.status(409).json({
      success: false,
      message: "Rate already exists for this milk type, FAT and SNF",
    });
  }

  const newRate = {
    id: Date.now().toString(),
    milkType,
    fat: Number(fat),
    snf: Number(snf),
    rate: Number(rate),
    createdAt: new Date().toISOString(),
    updatedAt: "",
  };

  rateMaster.push(newRate);

  res.status(201).json({
    success: true,
    message: "Rate added successfully",
    data: newRate,
  });
}

// UPDATE rate
function updateRate(req, res) {
  const rateId = req.params.id;

  const index = rateMaster.findIndex(
    (item) => item.id === rateId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Rate not found",
    });
  }

  const { milkType, fat, snf, rate } = req.body;

  const duplicateRate = rateMaster.find(
    (item) =>
      item.id !== rateId &&
      item.milkType === (milkType || rateMaster[index].milkType) &&
      Number(item.fat) === Number(fat ?? rateMaster[index].fat) &&
      Number(item.snf) === Number(snf ?? rateMaster[index].snf)
  );

  if (duplicateRate) {
    return res.status(409).json({
      success: false,
      message: "Another rate already exists for this milk type, FAT and SNF",
    });
  }

  rateMaster[index] = {
    ...rateMaster[index],
    milkType: milkType || rateMaster[index].milkType,
    fat: Number(fat ?? rateMaster[index].fat),
    snf: Number(snf ?? rateMaster[index].snf),
    rate: Number(rate ?? rateMaster[index].rate),
    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Rate updated successfully",
    data: rateMaster[index],
  });
}

// DELETE rate
function deleteRate(req, res) {
  const rateId = req.params.id;

  const index = rateMaster.findIndex(
    (item) => item.id === rateId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Rate not found",
    });
  }

  const deletedRate = rateMaster.splice(index, 1);

  res.status(200).json({
    success: true,
    message: "Rate deleted successfully",
    data: deletedRate[0],
  });
}

module.exports = {
  getAllRates,
  createRate,
  updateRate,
  deleteRate,
};