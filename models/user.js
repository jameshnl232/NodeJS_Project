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

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex( index => {
    return index.productId.toString() === product._id.toString();
  })
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if(cartProductIndex >= 0){
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  }
  else{
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    })
  }
  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.removeFromCart = function(productId){
  const updatedCartItems = this.cart.items.filter( item => {
    return item.productId.toString() !== productId.toString();
  })
  const updatedCart = {
    items: updatedCartItems
  }
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.clearCart = function() {
  this.cart = {items: []};
  return this.save();
}




module.exports = mongoose.model("User", userSchema);
