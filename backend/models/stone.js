const mongoose = require("mongoose");

const StoneSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  team: { type: String, required: true, maxlength: 20 },
});

module.exports = mongoose.model("Stone", StoneSchema);