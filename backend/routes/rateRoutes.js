const express=require("express");

const{

getAllRates,

createRate,

updateRate,

deleteRate

}=require("../controllers/rateController");

const router=express.Router();

router.get("/",getAllRates);

router.post("/",createRate);

router.put("/:id",updateRate);

router.delete("/:id",deleteRate);

module.exports=router;