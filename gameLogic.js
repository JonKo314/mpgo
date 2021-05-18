const Game = require("./models/game");

// TODO: Different board sizes and types (e.g. toroidal or with holes)
const BOARD_SIZE = 9;

const instances = new Map();

exports.get = async function (id) {
  let gameLogic = instances.get(id);
  if (gameLogic) {
    return gameLogic;
  }

  while (instances.get(id) === false) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  gameLogic = instances.get(id);
  if (gameLogic) {
    return gameLogic;
  }

  instances.set(id, false);
  gameLogic = new GameLogic(id);
  await gameLogic.initialize();
  instances.set(id, gameLogic);

  return gameLogic;
};

exports.newGame = async function () {
  const game = new Game({
    turnCounter: 1,
    turnEnd: new Date(Date.now() + 60000),
    stones: [],
  });
  await game.save();
  return game;
};

class GameLogic {
  constructor(id) {
    this.id = id;

    this.game = null;
    this.board = [];
    this.aliveMap = [];
    this.visitedMap = [];
  }

  async initialize() {
    const game = await Game.findById(this.id).populate({
      path: "stones",
      populate: { path: "user" },
    });
    if (!game) {
      throw new Error(`Game ${this.id} not found!`);
    }
    this.game = game;

    console.log(
      `Game ${game.id} loaded. Game is at turn ${game.turnCounter} until ${game.turnEnd}.`
    );

    if (game.turnEnd < Date.now()) {
      this.confirmStones();
    } else {
      const that = this;
      setTimeout(() => {
        that.confirmStones.bind(that)();
      }, game.turnEnd - Date.now());
    }
  }

  async addStone(stone) {
    if (
      this.game.currentStones.some(
        (currentStone) =>
          currentStone.x === stone.x && currentStone.y === stone.y
      )
    ) {
      throw new Error(
        `Stone rejected. Position (${stone.x}, ${stone.y}) is already occupied.`
      );
    }

    const allowedNewStonesCount = 1;
    if (
      this.game.pendingStones.filter((pendingStone) =>
        pendingStone.user.equals(stone.user)
      ).length >= allowedNewStonesCount
    ) {
      throw new Error(
        "Stone rejected. No more stones allowed for that user this turn."
      );
    }

    stone.isPending = true;
    stone.placedOnTurn = this.game.turnCounter;
    this.game.stones.push(stone);
    await this.game.save();
  }

  async removePendingStone(stone) {
    const savedStone = this.game.stones.find(
      (savedStone) =>
        stone.x === savedStone.x &&
        stone.y === savedStone.y &&
        stone.user.equals(savedStone.user) &&
        savedStone.isPending
    );
    if (savedStone) {
      savedStone.remove();
      await this.game.save();
    } else {
      throw new Error(
        `No stone for user ${stone.user.name} at (${stone.x}, ${stone.y}) to remove.`
      );
    }
  }

  getStones() {
    return this.game.stones;
  }

  // TODO: Function naming
  async confirmStones() {
    this.initializeBoard();

    let currentStones = this.game.currentStones;
    let pendingStones = this.game.pendingStones;
    let conflictedStones = [];
    let confirmedStones = [];

    pendingStones.forEach((stone) => {
      if (this.board[stone.y][stone.x].pendingStones.length > 1) {
        conflictedStones.push(stone);
      } else {
        confirmedStones.push(stone);
      }
    });

    // TODO: Elaborate conflict resolving
    conflictedStones.forEach((stone) => {
      this.board[stone.y][stone.x].pendingStones.length = 0;
      stone.isPending = false;
      stone.removedOnTurn = this.game.turnCounter;
      stone.removedBy = "CONFLICT";
    });

    confirmedStones.forEach((stone) => {
      this.board[stone.y][stone.x].pendingStones.length = 0;
      this.board[stone.y][stone.x].stone = stone;
      stone.isPending = false;
      currentStones.push(stone);
    });

    this.checkAllLiberties();

    let survivingStones = [];
    currentStones.forEach((stone) => {
      if (
        stone.placedOnTurn < this.game.turnCounter &&
        !this.aliveMap[stone.y][stone.x]
      ) {
        this.board[stone.y][stone.x].stone = null;
        stone.removedOnTurn = this.game.turnCounter;
        stone.removedBy = "DEATH";
      } else {
        survivingStones.push(stone);
      }
    });
    currentStones = survivingStones;

    this.checkAllLiberties();

    survivingStones = [];
    currentStones.forEach((stone) => {
      if (!this.aliveMap[stone.y][stone.x]) {
        this.board[stone.y][stone.x].stone = null;
        stone.removedOnTurn = this.game.turnCounter;
        stone.removedBy = "DEATH";
      }
    });

    this.game.turnEnd = new Date(Date.now() + 60000);
    this.game.turnCounter++;

    await this.game.save();
    console.log(
      `State saved. Turn: ${this.game.turnCounter} End: ${this.game.turnEnd}`
    );

    const that = this;
    setTimeout(() => {
      that.confirmStones.bind(that)();
    }, 60000);
  }

  initializeBoard() {
    this.board.length = 0;
    for (let y = 0; y < BOARD_SIZE; ++y) {
      this.board[y] = [];
      for (let x = 0; x < BOARD_SIZE; ++x) {
        this.board[y][x] = { x: x, y: y, stone: null, pendingStones: [] };
      }
    }

    // TODO: Beware redundancies
    this.game.currentStones.forEach((stone) => {
      this.board[stone.y][stone.x].stone = stone;
    });
    this.game.pendingStones.forEach((stone) => {
      this.board[stone.y][stone.x].pendingStones.push(stone);
    });
  }

  checkAllLiberties() {
    this.aliveMap.length = 0;
    this.aliveMap.length = BOARD_SIZE;
    this.visitedMap.length = 0;
    this.visitedMap.length = BOARD_SIZE;

    for (let y = 0; y < BOARD_SIZE; ++y) {
      this.aliveMap[y] = [];
      this.aliveMap[y].length = BOARD_SIZE;
      this.visitedMap[y] = [];
      this.visitedMap[y].length = BOARD_SIZE;
    }

    this.game.currentStones.forEach((stone) => {
      this.hasLiberty(stone);
    });
  }

  hasLiberty(stone) {
    if (this.visitedMap[stone.y][stone.x]) {
      return this.aliveMap[stone.y][stone.x];
    }

    this.visitedMap[stone.y][stone.x] = true;
    this.aliveMap[stone.y][stone.x] = this.getAdjacentPositions(stone).some(
      (position) => {
        const adjacentStone = this.board[position.y][position.x].stone;
        return (
          !adjacentStone ||
          (adjacentStone.user.equals(stone.user) &&
            this.hasLiberty(adjacentStone))
        );
      }
    );

    return this.aliveMap[stone.y][stone.x];
  }

  isValidPosition(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }

  getAdjacentPositions(stone) {
    return [
      { x: stone.x + 1, y: stone.y },
      { x: stone.x - 1, y: stone.y },
      { x: stone.x, y: stone.y + 1 },
      { x: stone.x, y: stone.y - 1 },
    ].filter((position) => this.isValidPosition(position.x, position.y));
  }
}
