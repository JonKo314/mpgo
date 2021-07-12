const Game = require("./models/game");

const instances = new Map();

const MAX_DATE = new Date(8640000000000000);

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

exports.newGame = async function (options) {
  const turnTime = options.turnTime || 60000;
  const game = new Game({
    ...{
      boardSize: 9, // TODO: Different board types (e.g. rectangular, toroidal or with holes)
    },
    ...options,
    ...{
      turnTime: turnTime,
      turnCounter: 1,
      turnEnd: new Date(Date.now() + turnTime),
      stones: [],
    },
  });
  await game.save();
  return game;
};

class GameLogic {
  constructor(id) {
    this.id = id;

    this.game = null;
    this.board = [];
    this.turnChangeTimeout = null;
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
    } else if (game.turnEnd.getTime() !== MAX_DATE.getTime()) {
      this.setTurnChangeTimeout();
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

  async haltTurn() {
    this.clearTurnChangeTimeout();
    this.game.turnEnd = MAX_DATE;

    await this.game.save();
    console.log(
      `Game ${this.game.id} saved. Turn halted: ${this.game.turnCounter} End: ${this.game.turnEnd}`
    );
  }

  async forceTurnChange() {
    this.clearTurnChangeTimeout();
    this.game.turnEnd = Date.now();
    await this.game.save();
    console.log(
      `Game ${this.game.id} saved. Turn forced to end: ${this.game.turnCounter} End: ${this.game.turnEnd}`
    );

    this.setTurnChangeTimeout(1000);
  }

  setTurnChangeTimeout() {
    const that = this;
    this.turnChangeTimeout = setTimeout(() => {
      that.confirmStones.bind(that)();
    }, this.game.turnEnd - Date.now());
  }

  clearTurnChangeTimeout() {
    if (this.turnChangeTimeout) {
      clearTimeout(this.turnChangeTimeout);
    }
    this.turnChangeTimeout = null;
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

    let survivingStones = [];
    let deadStones = [];
    this.getGroups().forEach((group) => {
      if (
        group.every((stone) => stone.placedOnTurn < this.game.turnCounter) &&
        group.every((stone) =>
          this.getAdjacentPositions(stone).every(
            (position) => this.board[position.y][position.x].stone
          )
        )
      ) {
        deadStones.push(...group);
      } else {
        survivingStones.push(...group);
      }
    });

    deadStones.forEach((stone) => {
      this.board[stone.y][stone.x].stone = null;
      stone.removedOnTurn = this.game.turnCounter;
      stone.removedBy = "DEATH";
    });
    currentStones = survivingStones;

    deadStones.length = 0;
    this.getGroups().forEach((group) => {
      if (
        group.every((stone) =>
          this.getAdjacentPositions(stone).every(
            (position) => this.board[position.y][position.x].stone
          )
        )
      ) {
        deadStones.push(...group);
      }
    });

    deadStones.forEach((stone) => {
      stone.removedOnTurn = this.game.turnCounter;
      stone.removedBy = "DEATH";
    });

    this.game.turnEnd = new Date(Date.now() + this.game.turnTime);
    this.game.turnCounter++;

    await this.game.save();
    console.log(
      `Game ${this.game.id} saved. Turn: ${this.game.turnCounter} End: ${this.game.turnEnd}`
    );

    this.setTurnChangeTimeout();
  }

  initializeBoard() {
    this.board.length = 0;
    for (let y = 0; y < this.game.boardSize; ++y) {
      this.board[y] = [];
      for (let x = 0; x < this.game.boardSize; ++x) {
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

  getGroups() {
    const groupBoard = [];
    groupBoard.length = this.game.boardSize;

    for (let y = 0; y < this.game.boardSize; ++y) {
      groupBoard[y] = [];
      groupBoard[y].length = this.game.boardSize;
    }

    const groups = new Map();
    let groupCounter = 0;
    for (let y = 0; y < this.game.boardSize; ++y) {
      for (let x = 0; x < this.game.boardSize; ++x) {
        const stone = this.board[y][x].stone;
        if (!stone) {
          continue;
        }

        const adjacentGroups = [];
        this.getAdjacentPositions({ x, y }).forEach((position) => {
          const adjacentStone = this.board[position.y][position.x].stone;
          if (adjacentStone && adjacentStone.user.equals(stone.user)) {
            const adjacentGroup = groupBoard[position.y][position.x];
            if (
              adjacentGroup != null &&
              adjacentGroups.every((group) => group !== adjacentGroup)
            ) {
              // not null or not undefined
              adjacentGroups.push(adjacentGroup);
            }
          }
        });

        if (adjacentGroups.length === 0) {
          const group = groupCounter++;
          groupBoard[y][x] = group;
          groups.set(group, [stone]);
        } else {
          const group = adjacentGroups.pop();
          groupBoard[y][x] = group;
          groups.get(group).push(stone);

          adjacentGroups.forEach((adjacentGroup) => {
            const stones = groups.get(adjacentGroup);
            groups.get(group).push(...stones);
            stones.forEach((adjacentStone) => {
              groupBoard[adjacentStone.y][adjacentStone.x] = group;
            });
            groups.delete(adjacentGroup);
          });
        }
      }
    }

    return groups;
  }

  isValidPosition(x, y) {
    return (
      x >= 0 && x < this.game.boardSize && y >= 0 && y < this.game.boardSize
    );
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
