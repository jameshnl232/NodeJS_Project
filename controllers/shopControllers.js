const { Result } = require("express-validator");
const Product = require("../models/product");
const User = require("../models/user");
const session = require("express-session");
const Order = require("../models/order");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require("pdfkit");
const fs = require("fs");

const ITEMS_PER_PAGE = 2;

exports.getIndex = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const productsTotal = await Product.find().countDocuments();

    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render("shop/home", {
      products: products,
      pageTitle: "Shop",
      path: "/",
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < productsTotal,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(productsTotal / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const productsTotal = await Product.find().countDocuments();

    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render("shop/products", {
      products: products,
      pageTitle: "Products",
      path: "/products",
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < productsTotal,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(productsTotal / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getProductDetails = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    res.render("shop/product-details", {
      product: product,
      pageTitle: "Product Details",
      path: "/products",
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      const toltalPrice = products.reduce((acc, product) => {
        return acc + product.quantity * product.productId.price;
      }, 0);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        count: products.length,
        totalPrice: toltalPrice,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCheckOut = (req, res, next) => {
  let products = [];
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      return (products = user.cart.items);
    })
    .then((products) => {
      res.render("shop/check-out", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        count: products.length,
        totalPrice: products.reduce((acc, product) => {
          return acc + product.quantity * product.productId.price;
        }, 0),
        STRIPE_SECRET_KEY: process.env.STRIPE_PUBLIC_KEY,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCheckOut = (req, res, next) => {
  let products = [];
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      return stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "eur",
              product_data: {
                name: p.productId.title,
              },
              unit_amount: p.productId.price * 100,
            },
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/check-out/success",
        cancel_url:
          req.protocol + "://" + req.get("host") + "/check-out/cancel",
      });
    })
    .then((session) => {
      return res.redirect(session.url);
      /*  res.render("shop/check-out", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        count: products.length,
        totalPrice: products.reduce((acc, product) => {
          return acc + product.quantity * product.productId.price;
        }, 0),
        sessionId: session.id,
        STRIPE_SECRET_KEY: process.env.STRIPE_PUBLIC_KEY,
      }); */
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckOutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((order) => {
      console.log(order);
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: order,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new Error("No order found"));
    }
    const invoiceName = "invoice-" + orderId + ".pdf";
    const invoicePath = "data/invoices/" + invoiceName;

    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="' + invoiceName + '"'
    );

    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text("Invoice", {
      underline: true,
    });

    pdfDoc.text("--------------------------------------------------");
    const totalPrice = order.products.reduce((acc, product) => {
      return acc + product.quantity * product.product.price;
    }, 0);
    order.products.forEach((prod) => {
      pdfDoc
        .fontSize(14)
        .text(
          prod.product.title +
            " - " +
            prod.quantity +
            " x " +
            prod.product.price +
            "€"
        );
    });
    pdfDoc.text("--------------------");
    pdfDoc.fontSize(20).text("Total Price: " + totalPrice + "€");
    pdfDoc.end();
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
