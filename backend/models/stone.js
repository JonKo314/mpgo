const mongoose = require("mongoose");

const StoneSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  isPending: { type: Boolean, required: true },
  placedOnTurn: { type: Number, required: true },
  removedOnTurn: { type: Number, required: false },
  removedBy: { type: String, enum: ["DEATH", "CONFLICT"] },
});

StoneSchema.virtual("player").get(function () {
  return this.parent();
});

module.exports = mongoose.model("Stone", StoneSchema);
