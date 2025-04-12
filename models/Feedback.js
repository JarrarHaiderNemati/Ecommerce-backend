const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema({
  email: String,
  name: String,
  rating: Number,
  message: String,
}, { timestamps: true });  // Enables createdAt and updatedAt fields

const Feedback = mongoose.model("Feedback", detailSchema);

module.exports = Feedback;
