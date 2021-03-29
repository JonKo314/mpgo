const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 20 },
  passwordHash: { select: false, type: String, maxlength: 60 }, // not required, because often not selected
  color: { type: String, required: true, maxlength: 20 }, // TODO: maxlength
});

module.exports = mongoose.model("User", UserSchema);
