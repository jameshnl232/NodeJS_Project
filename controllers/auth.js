const User = require("../models/user");

const bcrypt = require("bcryptjs");

const crypto = require("crypto");

const { validationResult } = require("express-validator");

const nodemailer = require("nodemailer");

const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
      repeatedPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = async function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        repeatedPassword: req.body.repeatedPassword,
      },
      validationErrors: errors.array(),
    });
  }
  try {
    const hashPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashPassword,
      cart: { items: [] },
    });
    user.save();
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getLogin = (req, res, next) => {
  var message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  try {
    const user = await User.findOne({ email: email });
    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save((err) => {
        console.log(err);
        res.redirect("/");
      });
    } else {
      res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password",
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [],
      });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
};

exports.getResetPassword = (req, res, next) => {
  var message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset-password",
    pageTitle: "Reset Password",
    errorMessage: message,
    oldInput: {
      email: "",
    },
    validationErrors: [],
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset", {
      path: "/reset-password",
      pageTitle: "Reset Password",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
      validationErrors: errors.array(),
    });
  }

  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    try {
      const user = await User.findOne({ email: email });
      if (!user) {
        req.flash("error", "No account with that email found");
        return res.redirect("/reset-password");
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      user.save();
      
      const sendEmail = await transporter.sendMail({
        to: email,
        from: "luongpower232@gmail.com",
        subject: "Password Reset",
        html: `
          <p>You requested a password reset</p>
          <p>Click this link <a href="http://localhost:3000/reset-password/${token}"> to set a new password </p>
        `,
      });
      req.flash("error", "Check your email");
      res.redirect("/login");
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    }
  });
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    var message = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      errorMessage: message,
      oldInput: {
        password: "",
        repeatedPassword: "",
      },
      userId: user._id.toString(),
      passwordToken: token,
      validationErrors: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const repeatedPassword = req.body.repeatedPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        password: newPassword,
        repeatedPassword: repeatedPassword,
      },
      userId: userId,
      passwordToken: passwordToken,
      validationErrors: errors.array(),
    });
  }
  try {
    const user = await User.findOne({
      _id: userId,
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
    });
    const hashPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    user.save();
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};
