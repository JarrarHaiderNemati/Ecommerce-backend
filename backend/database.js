const mongoose = require("mongoose");
const config = require("./config.js"); // Fix import for CommonJS

mongoose
  .connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

module.exports = mongoose; // Use CommonJS export
