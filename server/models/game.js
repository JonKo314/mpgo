const mongoose = require("mongoose");
const PlayerSchema = require("./player").schema;

const gameSchema = new mongoose.Schema({
  boardSize: { type: Number },
  turnTime: { type: Number },
  turnCounter: { type: Number },
  turnEnd: { type: Date },
  players: [PlayerSchema],
});

gameSchema.virtual("stones").get(function () {
  return [].concat.apply(
    [],
    this.players.map((player) => player.stones)
  );
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
