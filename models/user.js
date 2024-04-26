const mongoose = require("mongoose");
const { reset } = require("nodemon");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          require: true,
        },
        quantity: { type: Number, require: true },
      },
    ],
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

module.exports = mongoose.model("User", userSchema);
