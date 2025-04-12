const mongoose = require("mongoose");  // Import mongoose for MongoDB

// Define the user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's name (required)
  role: { type: String, required:true},
  email: { type: String, required: true, unique: true }, // User's email (must be unique)
  password: { type: String, required: true }, // Encrypted password
  createdAt: { type: Date, default: Date.now } // Automatically set creation date
});

// Create a model for the "users" collection
const User = mongoose.model("User", userSchema);

module.exports = User; // Export the model for use in other files
