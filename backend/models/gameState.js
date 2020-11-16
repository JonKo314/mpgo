const mongoose = require("mongoose");

const GameStateSchema = new mongoose.Schema({
  turnCounter: { type: Number },
  turnEnd: { type: Date },
});

module.exports = mongoose.model("GameState", GameStateSchema);
