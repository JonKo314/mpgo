const express = require("express");
const router = express.Router();

const Game = require("../models/game");
const Stone = require("../models/stone");
const GameLogic = require("../gameLogic");

// TODO: What happens if things are called while turn change is in progress?

router.post("/", async (req, res) => {
  const game = await GameLogic.newGame();
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
        (req.user && req.user.equals(stone.user))
    );
  res.json(stones);
});

router.get("/:gameId/gameState", async (req, res) => {
  const game = await Game.findById(req.params.gameId);
  delete game.stones;
  res.json(game);
});

router.post("/:gameId/addStone", async (req, res, next) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  try {
    const stone = new Stone(req.body);
    if (!req.user || !stone.user || !req.user.equals(stone.user)) {
      throw new Error("Stone owner doesn't match user.");
    }
    stone.user = req.user;
    await gameLogic.addStone(stone);
    res.status(200).json(stone);
  } catch (err) {
    return next(err);
  }
});

router.post("/:gameId/removePendingStone", async (req, res, next) => {
  const gameLogic = await GameLogic.get(req.params.gameId);
  try {
    const stone = new Stone(req.body);
    if (!req.user || !stone.user || !req.user.equals(stone.user)) {
      throw new Error("Stone owner doesn't match user.");
    }
    stone.user = req.user;
    await gameLogic.removePendingStone(stone);
    res.status(200).json(stone);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
