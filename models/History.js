const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema({
  email: String,
  name: String,
  quantity: Number,
  price: Number,
  category: String
}, { timestamps: true });  // Enables createdAt and updatedAt fields

const History = mongoose.model("History", detailSchema);

module.exports = History;
