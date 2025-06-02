const express=require('express');

const router=express.Router();

const { ensureAdmin } = require('../middlewares/auth');

const ServiceContl=require("../controllers/serviceController")

router.get("/",ensureAdmin,ServiceContl.services);
router.post("/addservice",ensureAdmin,ServiceContl.addservice);
router.get("/viewservice",ensureAdmin,ServiceContl.viewservice);
router.get("/getservice/:id",ensureAdmin,ServiceContl.getservice);
router.post("/updateservice",ensureAdmin,ServiceContl.updateservice);
router.get("/deleteservice/:id",ensureAdmin,ServiceContl.deleteservice);
module.exports = router;