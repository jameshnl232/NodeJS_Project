const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const adminControllers = require("../controllers/adminControllers");

const isAuth = require("../middlewares/isAuth");

const Product = require("../models/product");

const addProductValidation = [
  body("title")
    .isString()
    .isLength({ min: 3 })
    .trim()
    .withMessage("Title must be at least 3 characters long"),
  body("price").isFloat().withMessage("Price must be a number"),
  body("description")
    .isLength({ min: 5, max: 400 })
    .trim()
    .withMessage("Description must be between 5 and 400 characters"),
];

router.get("/add-product", isAuth, adminControllers.getAddProduct);

router.post("/add-product", addProductValidation, isAuth, adminControllers.postAddProduct);

router.get("/edit-product/:productId", isAuth, adminControllers.getEditProduct);

router.post("/edit-product", adminControllers.postEditProduct);

router.delete("/delete-product/:productId", adminControllers.deleteProduct);

router.get("/products", adminControllers.getProducts);

module.exports = router;
