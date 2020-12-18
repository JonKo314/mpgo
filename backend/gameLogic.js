const GameState = require("./models/gameState");
const Stone = require("./models/stone");

let state;

exports.addStone = async function (stone) {
  await stone.save();
};

// TODO: Function naming
exports.initialize = async function () {
  state = await GameState.findOne();
  if (!state) {
    state = new GameState({
      turnCounter: 1,
      turnEnd: new Date(Date.now() + 60000),
    });
    await state.save();
  }

  console.log("GameState loaded:\n" + state);
  const confirmStones = async () => {
    // TODO: Place stones, handle conflicts and captures
    pendingStones.forEach(async (stone) => {
      stone.isPending = false;
      await stone.save();
    });
    state.turnEnd = new Date(Date.now() + 60000);
    state.turnCounter++;
    await state.save();
    console.log(
      `State saved. Turn: ${state.turnCounter} End: ${state.turnEnd}`
    );
    setTimeout(confirmStones, 60000);
  };
  if (state.turnEnd < Date.now()) {
    confirmStones();
  } else {
    setTimeout(confirmStones, state.turnEnd - Date.now());
  }
};
