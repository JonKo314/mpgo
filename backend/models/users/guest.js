const mongoose = require("mongoose");
const User = require("./user");

const GuestUserSchema = new mongoose.Schema({
  token: { type: String, required: true },
});

module.exports = User.discriminator("GuestUser", GuestUserSchema);
