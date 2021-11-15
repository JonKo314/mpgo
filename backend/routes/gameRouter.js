const express = require("express");
const router = express.Router();

const Game = require("../models/game");
const Stone = require("../models/stone");
const Player = require("../models/player");
const GameLogic = require("../gameLogic");

const createPlayer = (user) => {
  const { color, secondaryColor } = user;
  return new Player({ user, color, secondaryColor, stones: [] });
};

// TODO: What happens if things are called while turn change is in progress?

router.post("/", async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new Error("Forbidden!"); // TODO: Allow at some point
    }

    const game = await GameLogic.newGame(req.body);
    res.json(game);
  } catch (error) {
    return next(error);
  }
});

router.get("/list", async (req, res) => {
  const games = await Game.find({}, "_id");
  res.json(games);
});

router.get("/:gameId/getStones", async (req, res) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  const stones = await gameLogic
    .getStones()
    .filter(
      (stone) =>
        !(stone.isPending || stone.removedBy === "CONFLICT") ||
        (req.user && req.user.equals(stone.player.user))
    )
    .map((stone) => {
      // TODO: Refactor or deduplicate, see addStone()
      const player = stone.player.toObject();
      delete player.stones;
      delete player.user;
      const apiStone = stone.toObject();
      apiStone.player = player;
      return apiStone;
    });

  res.json(stones);
});

router.get("/:gameId/gameState", async (req, res) => {
  const game = await Game.findById(req.params.gameId, "-players.stones");
  res.json(game);
});

router.get("/:gameId/player", async (req, res) => {
  if (!req.user) {
    return res.json(null);
  }

  const gameLogic = await GameLogic.get(req.params.gameId);
  res.json(gameLogic.getPlayer(req.user) || null);
});

router.post("/:gameId/settings", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Login to change game settings.");
    }

    if (!req.user.isAdmin) {
      throw new Error("Forbidden!"); // TODO: Allow at some point
    }

    const gameLogic = await GameLogic.get(req.params.gameId);
    await gameLogic.setSettings(req.body);
    res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
});

router.post("/:gameId/colors", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Login to change player colors.");
    }

    const gameLogic = await GameLogic.get(req.params.gameId);
    const player = gameLogic.getPlayer(req.user);
    if (!player) {
      throw new Error("Join game to change player colors.");
    }

    await gameLogic.updatePlayers([
      {
        _id: player._id,
        color: req.body.color,
        secondaryColor: req.body.secondaryColor,
      },
    ]);
    res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
});

router.post("/:gameId/join", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Login to join game.");
    }
    const gameLogic = await GameLogic.get(req.params.gameId);
    const player = await gameLogic.addPlayer(createPlayer(req.user));
    res.json(player);
  } catch (error) {
    return next(error);
  }
});

router.post("/:gameId/start", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Login to start game.");
    }

    if (!req.user.isAdmin) {
      throw new Error("Forbidden!"); // TODO: Allow at some point
    }

    const gameLogic = await GameLogic.get(req.params.gameId);
    await gameLogic.startGame();
    res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
});

router.post("/:gameId/addStone", async (req, res, next) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  try {
    let stone = new Stone(req.body);
    if (!req.user) {
      throw new Error("Login to place stones.");
    }

    let player = gameLogic.getPlayer(req.user);
    if (!player) {
      throw new Error("Join game to place stones.");
    }

    stone = await gameLogic.addStone(player, stone);
    // TODO: Refactor or deduplicate, see getStones()
    const playerWithoutStones = stone.player.toObject();
    delete playerWithoutStones.stones;
    const apiStone = stone.toObject();
    apiStone.player = playerWithoutStones;
    res.status(200).json(apiStone);
  } catch (err) {
    return next(err);
  }
});

router.post("/:gameId/removePendingStone", async (req, res, next) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  try {
    const stone = new Stone(req.body);
    if (!req.user) {
      throw new Error("Login to remove stones");
    }

    let player = gameLogic.getPlayer(req.user);
    if (!player) {
      throw new Error("No player found for that user");
    }

    await gameLogic.removePendingStone(player, stone);
    res.status(200).json(stone);
  } catch (err) {
    return next(err);
  }
});

router.post("/:gameId/haltTurn", async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new Error("Forbidden!"); // TODO: Allow at some point
    }

    const gameLogic = await GameLogic.get(req.params.gameId);
    await gameLogic.haltTurn();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post("/:gameId/endTurn", async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new Error("Forbidden!"); // TODO: Allow at some point
    }

    const gameLogic = await GameLogic.get(req.params.gameId);
    await gameLogic.forceTurnChange();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
