const mongoose = require("mongoose");

const StoneSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  team: { type: String, required: true, maxlength: 20 },
  isPending: { type: Boolean, required: true },
  placedOnTurn: { type: Number, required: true },
  removedOnTurn: { type: Number, required: false },
});

const gameSchema = new mongoose.Schema({
  stones: [StoneSchema],
});

gameSchema.virtual("currentStones").get(function () {
  return this.stones.filter(
    (stone) => !stone.isPending && !stone.removedOnTurn
  );
});

gameSchema.virtual("pendingStones").get(function () {
  return this.stones.filter((stone) => stone.isPending);
});

module.exports = mongoose.model("Game", gameSchema);
