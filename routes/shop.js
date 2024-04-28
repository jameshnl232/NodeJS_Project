const express = require("express");

const router = express.Router();

const controllers  = require("../controllers/shopControllers");

const isAuth = require("../middlewares/isAuth");


router.get("/", controllers.getIndex);

router.get("/products", controllers.getProducts);

router.get("/product-details/:productId", controllers.getProductDetails);

router.get("/cart", isAuth, controllers.getCart);

router.post("/cart", isAuth, controllers.postCart);

router.post("/cart-delete-item", isAuth, controllers.postCartDeleteProduct);

router.get("/orders", isAuth, controllers.getOrders);


router.get("/check-out", isAuth ,controllers.getCheckOut);

router.post("/check-out", isAuth, controllers.postCheckOut);

router.get("/check-out/success", controllers.getCheckOutSuccess);

router.get("/check-out/cancel", controllers.getCheckOut);

router.get("/orders/:orderId", isAuth, controllers.getInvoice);


module.exports = router;
