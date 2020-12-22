const GameState = require("./models/gameState");
const Stone = require("./models/stone");

const BOARD_SIZE = 9;
const board = [];

let state;
let currentStones = [];
let pendingStones = [];
let confirmedStones = [];
let conflictedStones = [];

exports.addStone = async function (stone) {
  if (board[stone.y][stone.x].stone) {
    throw new Error(
      `Stone rejected. Position (${x}, ${y}) is already occupied.`
    );
  }

  stone.placedOnTurn = state.turnCounter;
  await stone.save();

  // TODO: Beware redundancies
  pendingStones.push(stone);
  board[stone.y][stone.x].pendingStones.push(stone);
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

  currentStones = await Stone.find({ isPending: false, removedOnTurn: null });
  pendingStones = await Stone.find({ isPending: true });

  initializeBoard();

  const confirmStones = async () => {
    // TODO: Place stones, handle conflicts and captures
    pendingStones.forEach((stone) => {
      if (board[stone.y][stone.x].pendingStones.length > 1) {
        conflictedStones.push(stone);
      } else {
        confirmedStones.push(stone);
      }
    });
    pendingStones.length = 0;

    conflictedStones.forEach(async (stone) => {
      board[stone.y][stone.x].pendingStones.length = 0;
      stone.isPending = false;
      stone.removedOnTurn = state.turnCounter;
      await stone.save();
    });
    conflictedStones.length = 0;

    confirmedStones.forEach(async (stone) => {
      board[stone.y][stone.x].pendingStones.length = 0;
      board[stone.y][stone.x].stone = stone;
      stone.isPending = false;
      await stone.save();
      currentStones.push(stone);
    });
    confirmedStones.length = 0;

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

function initializeBoard() {
  board.length = 0;
  for (let y = 0; y < BOARD_SIZE; ++y) {
    board[y] = [];
    for (let x = 0; x < BOARD_SIZE; ++x) {
      board[y][x] = { x: x, y: y, stone: null, pendingStones: [] };
    }
  }

  currentStones.forEach((stone) => {
    board[stone.y][stone.x].stone = stone;
  });
  pendingStones.forEach((stone) => {
    board[stone.y][stone.x].pendingStones.push(stone);
  });
}
