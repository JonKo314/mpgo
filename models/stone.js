const mongoose = require("mongoose");

const StoneSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isPending: { type: Boolean, required: true },
  placedOnTurn: { type: Number, required: true },
  removedOnTurn: { type: Number, required: false },
});

module.exports = mongoose.model("Stone", StoneSchema);