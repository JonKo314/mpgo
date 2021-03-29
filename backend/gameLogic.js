const Game = require("./models/game");
const GameState = require("./models/gameState");

// TODO: Different board sizes and types (e.g. toroidal or with holes)
const BOARD_SIZE = 9;
const board = [];
const aliveMap = [];
const visitedMap = [];

let game;
let state;

exports.addStone = async function (stone) {
  if (
    game.currentStones.some(
      (currentStone) => currentStone.x === stone.x && currentStone.y === stone.y
    )
  ) {
    throw new Error(
      `Stone rejected. Position (${stone.x}, ${stone.y}) is already occupied.`
    );
  }

  const allowedNewStonesCount = 1;
  if (
    game.pendingStones.filter((pendingStone) =>
      pendingStone.user.equals(stone.user)
    ).length >= allowedNewStonesCount
  ) {
    throw new Error(
      "Stone rejected. No more stones allowed for that user this turn."
    );
  }

  stone.isPending = true;
  stone.placedOnTurn = state.turnCounter;
  game.stones.push(stone);
  await game.save();
};

exports.removePendingStone = async function (stone) {
  const savedStone = game.stones.find(
    (savedStone) =>
      stone.x === savedStone.x &&
      stone.y === savedStone.y &&
      stone.user.equals(savedStone.user) &&
      savedStone.isPending
  );
  if (savedStone) {
    savedStone.remove();
    await game.save();
  } else {
    throw new Error(
      `No stone for user ${stone.user.name} at (${stone.x}, ${stone.y}) to remove.`
    );
  }
};

exports.getStones = function () {
  return game.stones.filter((stone) => !stone.removedOnTurn);
};

// TODO: Function naming
exports.initialize = async function () {
  game = await Game.findOne().populate({
    path: "stones",
    populate: { path: "user" },
  });
  if (!game) {
    game = new Game({ stones: [] });
    await game.save();
  }

  state = await GameState.findOne();
  if (!state) {
    state = new GameState({
      turnCounter: 1,
      turnEnd: new Date(Date.now() + 60000),
    });
    await state.save();
  }

  console.log("GameState loaded:\n" + state);

  if (state.turnEnd < Date.now()) {
    confirmStones();
  } else {
    setTimeout(confirmStones, state.turnEnd - Date.now());
  }
};

// TODO: Function naming
async function confirmStones() {
  initializeBoard();

  let currentStones = game.currentStones;
  let pendingStones = game.pendingStones;
  let conflictedStones = [];
  let confirmedStones = [];

  pendingStones.forEach((stone) => {
    if (board[stone.y][stone.x].pendingStones.length > 1) {
      conflictedStones.push(stone);
    } else {
      confirmedStones.push(stone);
    }
  });

  // TODO: Elaborate conflict resolving
  conflictedStones.forEach((stone) => {
    board[stone.y][stone.x].pendingStones.length = 0;
    stone.isPending = false;
    stone.removedOnTurn = state.turnCounter;
  });

  confirmedStones.forEach((stone) => {
    board[stone.y][stone.x].pendingStones.length = 0;
    board[stone.y][stone.x].stone = stone;
    stone.isPending = false;
    currentStones.push(stone);
  });

  checkAllLiberties();

  let survivingStones = [];
  currentStones.forEach((stone) => {
    if (stone.placedOnTurn < state.turnCounter && !aliveMap[stone.y][stone.x]) {
      board[stone.y][stone.x].stone = null;
      stone.removedOnTurn = state.turnCounter;
    } else {
      survivingStones.push(stone);
    }
  });
  currentStones = survivingStones;

  checkAllLiberties();

  survivingStones = [];
  currentStones.forEach((stone) => {
    if (!aliveMap[stone.y][stone.x]) {
      board[stone.y][stone.x].stone = null;
      stone.removedOnTurn = state.turnCounter;
    }
  });

  state.turnEnd = new Date(Date.now() + 60000);
  state.turnCounter++;

  await game.save();
  await state.save();
  console.log(`State saved. Turn: ${state.turnCounter} End: ${state.turnEnd}`);

  setTimeout(confirmStones, 60000);
}

function initializeBoard() {
  board.length = 0;
  for (let y = 0; y < BOARD_SIZE; ++y) {
    board[y] = [];
    for (let x = 0; x < BOARD_SIZE; ++x) {
      board[y][x] = { x: x, y: y, stone: null, pendingStones: [] };
    }
  }

  // TODO: Beware redundancies
  game.currentStones.forEach((stone) => {
    board[stone.y][stone.x].stone = stone;
  });
  game.pendingStones.forEach((stone) => {
    board[stone.y][stone.x].pendingStones.push(stone);
  });
}

function checkAllLiberties() {
  aliveMap.length = 0;
  aliveMap.length = BOARD_SIZE;
  visitedMap.length = 0;
  visitedMap.length = BOARD_SIZE;

  for (let y = 0; y < BOARD_SIZE; ++y) {
    aliveMap[y] = [];
    aliveMap[y].length = BOARD_SIZE;
    visitedMap[y] = [];
    visitedMap[y].length = BOARD_SIZE;
  }

  game.currentStones.forEach((stone) => {
    hasLiberty(stone);
  });
}

function hasLiberty(stone) {
  if (visitedMap[stone.y][stone.x]) {
    return aliveMap[stone.y][stone.x];
  }

  visitedMap[stone.y][stone.x] = true;
  aliveMap[stone.y][stone.x] = getAdjacentPositions(stone).some((position) => {
    const adjacentStone = board[position.y][position.x].stone;
    return (
      !adjacentStone ||
      (adjacentStone.user.equals(stone.user) && hasLiberty(adjacentStone))
    );
  });

  return aliveMap[stone.y][stone.x];
}

function isValidPosition(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getAdjacentPositions(stone) {
  return [
    { x: stone.x + 1, y: stone.y },
    { x: stone.x - 1, y: stone.y },
    { x: stone.x, y: stone.y + 1 },
    { x: stone.x, y: stone.y - 1 },
  ].filter((position) => isValidPosition(position.x, position.y));
}
