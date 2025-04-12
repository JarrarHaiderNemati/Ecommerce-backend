const mongoose=require('mongoose');

const detailSchema = new mongoose.Schema({
  email: String,
  name: String,
  quantity: Number,
  price: Number,
  category: String,
  photo: String
});

const Cart = mongoose.model("Cart", detailSchema);

module.exports = Cart;   