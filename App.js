const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const db = require("./utils/db");
const User = require("./models/user");
const { v4: uuidv4 } = require("uuid");

//flash messages
const flash = require("connect-flash");

//csrf
const csrf = require("csurf");

//app
const app = express();

//miiddleware multer
const multer = require("multer");
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("imageUrl")
);

// routers
const router = require("./routes/shop");
const authRouter = require("./routes/auth");
const errorController = require("./controllers/error");
const adminRouter = require("./routes/admin");
const shopRouter = require("./routes/shop");

// body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// session
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const MONGODB_URL = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.1gqoe0y.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0`;

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: "sessions",
});

// Catch errors
store.on("error", function (error) {
  console.log(error);
});

//use session
app.use(
  session({
    secret: "This is a secret",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true,
  })
);

// middlewares: setting up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middlewares: static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));




//use flash
app.use(flash());

//csrf protection
const csrfProtection = csrf();
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//middleware: req.user
app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  try {
    const user = await User.findById(req.session.user._id);
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
});


// middlewares: routes
app.use("/admin", adminRouter);
app.use(authRouter);
app.use(shopRouter);

app.use(router);
app.get("/500", errorController.get500);

app.use(errorController.get404);

// error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    //isAuthenticated: req.session.isLoggedIn
  });
});

// db connection and server connection
db()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
      console.log("Connected to database");
    });
  })
  .catch((err) => {
    console.log(err);
  });
