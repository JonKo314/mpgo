const express = require("express");
const router = express.Router();

const Game = require("../models/game");
const Stone = require("../models/stone");
const Player = require("../models/player");
const GameLogic = require("../gameLogic");

// TODO: What happens if things are called while turn change is in progress?

router.post("/", async (req, res) => {
  const game = await GameLogic.newGame(req.body);
  res.json(game);
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
      const apiStone = stone.toObject();
      apiStone.player = player;
      return apiStone;
    });

  res.json(stones);
});

router.get("/:gameId/gameState", async (req, res) => {
  const game = await Game.findById(req.params.gameId).populate({
    path: "players",
    populate: { path: "user" },
  });
  delete game.stones;
  res.json(game);
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
      player = new Player({
        user: req.user,
        color: req.user.color,
        secondaryColor: req.user.secondaryColor,
        stones: [],
      });
      player = await gameLogic.addPlayer(player);
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
  const gameLogic = await GameLogic.get(req.params.gameId);
  await gameLogic.haltTurn();
  res.sendStatus(200);
});

router.post("/:gameId/endTurn", async (req, res, next) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  await gameLogic.forceTurnChange();
  res.sendStatus(200);
});

module.exports = router;
