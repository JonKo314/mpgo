const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 20 },
  passwordHash: { select: false, type: String, required: true, maxlength: 60 },
});

module.exports = mongoose.model("User", UserSchema);
