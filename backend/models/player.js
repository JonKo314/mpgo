const mongoose = require("mongoose");
const StoneSchema = require("./stone").schema;

// TODO: Color type? Deduplicate color regex? Also used in user.js
const PlayerSchema = new mongoose.Schema({
  user: { select: false, type: mongoose.Schema.Types.ObjectId, ref: "User" },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  secondaryColor: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  stones: [StoneSchema],
  confirmedByAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model("Player", PlayerSchema);
