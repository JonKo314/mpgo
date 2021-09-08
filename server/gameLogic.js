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
      path: "players",
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

  getPlayer(user) {
    return this.game.players.find((player) => player.user.equals(user));
  }

  async addPlayer(player) {
    this.game.players.push(player);
    await this.game.save();
    return this.game.players.find((storedPlayer) =>
      storedPlayer.equals(player)
    );
  }

  async addStone(player, stone) {
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
        pendingStone.player.equals(player)
      ).length >= allowedNewStonesCount
    ) {
      throw new Error(
        "Stone rejected. No more stones allowed for that player this turn."
      );
    }

    stone.isPending = true;
    stone.placedOnTurn = this.game.turnCounter;
    player.stones.push(stone);
    await this.game.save();
    return this.game.players
      .find((p) => player.equals(p))
      .stones.find((s) => stone.equals(s));
  }

  async removePendingStone(player, stone) {
    const savedStone = this.game.stones.find(
      (savedStone) =>
        stone.x === savedStone.x &&
        stone.y === savedStone.y &&
        player.equals(savedStone.player) &&
        savedStone.isPending
    );
    if (savedStone) {
      savedStone.remove();
      await this.game.save();
    } else {
      throw new Error(
        `No stone for player ${player} at (${stone.x}, ${stone.y}) to remove.`
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

    const [conflictWinners, conflictLosers] =
      this.resolveConflicts(conflictedStones);
    confirmedStones.push(...conflictWinners);

    conflictLosers.forEach((stone) => {
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

  resolveConflicts(conflictedStones) {
    const heatMaps = this.getHeatMaps();
    const successfulStones = [];
    const failedStones = [];

    conflictedStones.forEach((position) => {
      const pendingStones = this.board[position.y][position.x].pendingStones;
      if (!pendingStones.length) {
        return;
      }

      const [minHeat, minHeatStones, higherHeatStones] = pendingStones.reduce(
        ([minHeat, minHeatStones, higherHeatStones], stone) => {
          const heat = heatMaps.get(stone.player.user.name)[stone.y][stone.x];
          if (heat < minHeat) {
            return [heat, [stone], [...higherHeatStones, ...minHeatStones]];
          }
          if (heat == minHeat) {
            return [heat, [...minHeatStones, stone], higherHeatStones];
          }
          return [minHeat, minHeatStones, [...higherHeatStones, stone]];
        },
        [Infinity, [], []]
      );

      failedStones.push(...higherHeatStones);
      (minHeatStones.length === 1 ? successfulStones : failedStones).push(
        ...minHeatStones
      );
    });

    return [successfulStones, failedStones];
  }

  // TODO: Deduplicate code, see index.html
  getHeatMaps() {
    const getDistance = (a, b) => {
      const dx2 = Math.pow(Math.abs(a.x - b.x), 2);
      const dy2 = Math.pow(Math.abs(a.y - b.y), 2);
      return Math.sqrt(dx2 + dy2);
    };

    // TODO: Use this.game.players
    // TODO: user name is nice for debugging, but requires many subdocuments
    const userNames = new Set(
      this.game.stones.map((stone) => stone.player.user.name)
    );
    const heatMaps = new Map(
      [...userNames].map((userName) => [
        userName,
        Array(this.game.boardSize)
          .fill()
          .map(() => Array(this.game.boardSize).fill(0)),
      ])
    );

    this.game.stones
      .filter((stone) => !stone.isPending && stone.removedBy !== "CONFLICT")
      .forEach((stone) => {
        for (let y = 0; y < this.game.boardSize; ++y) {
          for (let x = 0; x < this.game.boardSize; ++x) {
            const distance = Math.max(1.0, getDistance({ x, y }, stone));
            heatMaps.get(stone.player.user.name)[y][x] +=
              Math.pow(0.5, this.game.turnCounter - stone.placedOnTurn - 1) /
              distance;
          }
        }
      });

    return heatMaps;
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
          if (adjacentStone && adjacentStone.player.equals(stone.player)) {
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