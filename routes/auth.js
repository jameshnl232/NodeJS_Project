const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/auth");

const User = require("../models/user");

const signupValidator = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .not()
    .isEmpty()
    .withMessage("Please enter an email")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email already exists");
      }
    })
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .not()
    .isEmpty()
    .withMessage("Please enter a password")
    .isAlphanumeric()
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.repeatedPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("checkbox", "Please agree to the terms and conditions").notEmpty(),
];

const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .not()
    .isEmpty()
    .withMessage("Please enter an email")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (!user) {
        throw new Error("Email does not exists");
      }
    })
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .notEmpty()
    .withMessage("Please enter a password")
    .isAlphanumeric()
    .trim(),
];

const newPasswordValidator = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .not()
    .isEmpty()
    .withMessage("Please enter a password")
    .isAlphanumeric()
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.repeatedPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

router.get("/signup", authController.getSignup);

router.get("/login", authController.getLogin);

router.post("/signup", signupValidator, authController.postSignup);

router.post("/login", loginValidator, authController.postLogin);

router.post("/logout", authController.postLogout);

router.get("/reset-password", authController.getResetPassword);

router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .not()
      .isEmpty()
      .withMessage("Please enter an email")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (!user) {
          throw new Error("Email does not exists");
        }
      })
      .normalizeEmail(),
  ],
  authController.postResetPassword
);

router.get("/reset-password/:token", authController.getNewPassword);

router.post("/new-password", newPasswordValidator, authController.postNewPassword);


module.exports = router;
