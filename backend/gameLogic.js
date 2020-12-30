const GameState = require("./models/gameState");
const Stone = require("./models/stone");

// TODO: Different board sizes and types (e.g. toroidal or with holes)
const BOARD_SIZE = 9;
const board = [];
const aliveMap = [];
const visitedMap = [];

let state;
let currentStones = [];
let pendingStones = [];
let confirmedStones = [];
let conflictedStones = [];
let changedStones = new Set();

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
    changedStones.length = 0;

    // TODO: Place stones, handle conflicts and captures
    pendingStones.forEach((stone) => {
      if (board[stone.y][stone.x].pendingStones.length > 1) {
        conflictedStones.push(stone);
      } else {
        confirmedStones.push(stone);
      }
    });
    pendingStones.length = 0;

    conflictedStones.forEach((stone) => {
      board[stone.y][stone.x].pendingStones.length = 0;
      stone.isPending = false;
      stone.removedOnTurn = state.turnCounter;
      changedStones.add(stone);
    });
    conflictedStones.length = 0;

    confirmedStones.forEach((stone) => {
      board[stone.y][stone.x].pendingStones.length = 0;
      board[stone.y][stone.x].stone = stone;
      stone.isPending = false;
      currentStones.push(stone);
      changedStones.add(stone);
    });
    confirmedStones.length = 0;

    checkAllLiberties();

    let survivingStones = [];
    currentStones.forEach((stone) => {
      if (
        stone.placedOnTurn < state.turnCounter &&
        !aliveMap[stone.y][stone.x]
      ) {
        board[stone.y][stone.x].stone = null;
        stone.removedOnTurn = state.turnCounter;
        changedStones.add(stone);
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
        changedStones.add(stone);
      } else {
        survivingStones.push(stone);
      }
    });
    currentStones = survivingStones;

    state.turnEnd = new Date(Date.now() + 60000);
    state.turnCounter++;

    // TODO: Race conditions for all those calls of .save()
    // Maybe use a single document, cross document dependencies might be evil
    // Or use transactions, but those might be rather new.
    changedStones.forEach(async (stone) => await stone.save());
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

  currentStones.forEach((stone) => {
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
      (adjacentStone.team === stone.team && hasLiberty(adjacentStone))
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
