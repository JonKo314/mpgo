const mongoose = require("mongoose");
const StoneSchema = require("./stone").schema;

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
