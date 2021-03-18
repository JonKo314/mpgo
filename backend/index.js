const express = require("Express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("morgan");

const Stone = require("./models/stone");
const GameState = require("./models/gameState");
const GameLogic = require("./gameLogic");

const app = express();
const port = 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(cors({ origin: true })); // TODO: Is this secure?

// TODO: What happens if this is called while turn change is in progress?
app.get("/", (req, res) => {
  const stones = GameLogic.getStones().filter((stone) => !stone.removedOnTurn);
  res.json(stones);
});

// TODO: What happens if this is called while turn change is in progress?
app.get("/gameState", async (req, res) => {
  const state = await GameState.findOne();
  res.json(state);
});

app.post("/", async (req, res, next) => {
  try {
    const stone = new Stone(req.body);
    await GameLogic.addStone(stone);
    res.status(200).json(stone);
  } catch (err) {
    return next(err);
  }
});

app.post("/removePendingStone", async (req, res, next) => {
  try {
    const stone = new Stone(req.body);
    await GameLogic.removePendingStone(stone);
    res.status(200).json(stone);
  } catch (err) {
    return next(err);
  }
});

mongoose.connect("mongodb://localhost/mpgo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", async () => {
  console.log("MongoDB connection opened");

  // TODO: Check for race conditions and other dangerous things
  await GameLogic.initialize();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
