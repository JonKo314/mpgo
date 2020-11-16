const mongoose = require("mongoose");

const StoneSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  team: { type: String, required: true, maxlength: 20 },
  isPending: { type: Boolean, required: true },
});

module.exports = mongoose.model("Stone", StoneSchema);
