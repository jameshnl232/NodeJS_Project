const express = require("express");

const router = express.Router();

const controllers  = require("../controllers/shopControllers");


router.get("/", controllers.getIndex);

module.exports = router;
