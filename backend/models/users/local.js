const mongoose = require("mongoose");
const User = require("./user");

const LocalUserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 20 },
  passwordHash: { select: false, type: String, maxlength: 60, required: true },
});

module.exports = User.discriminator("LocalUser", LocalUserSchema);
