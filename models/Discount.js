const mongoose=require('mongoose');

const detailSchema = new mongoose.Schema({
  name: String,
  price: Number,
  discountPrice: Number,
  category: String
});

const Discount = mongoose.model("Discount", detailSchema);

module.exports = Discount;   