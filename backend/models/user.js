const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 20 },
  passwordHash: { select: false, type: String, maxlength: 60, required: true },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  secondaryColor: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },

  // immutable isAdmin
  // Can only be set directly in database or on document creation
  // Shouldn't be set on document creation
  isAdmin: { type: Boolean, default: false, immutable: true },
});

module.exports = mongoose.model("User", UserSchema);
