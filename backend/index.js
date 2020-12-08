const express = require("Express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("morgan");

const Stone = require("./models/stone");
const GameState = require("./models/gameState");

const app = express();
const port = 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(cors({ origin: true })); // TODO: Is this secure?

// TODO: What happens if this is called while turn change is in progress?
app.get("/", async (req, res) => {
  const stones = await Stone.find();
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
    await stone.save();
    res.status(200).json(stone);
  } catch (err) {
    if (err.errors && err.message) {
      // Probably a validation error by mongoose and the client's fault
      res.status(400).send(err.message);
    } else {
      throw err;
    }
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
  const state =
    (await GameState.findOne()) ||
    new GameState({
      turnCounter: 1,
      endTurn: new Date(Date.now() + 60000),
    });
  const confirmStones = async () => {
    const pendingStones = await Stone.find({ isPending: true });
    // TODO: Place stones, handle conflicts and captures
    pendingStones.forEach(async (stone) => {
      stone.isPending = false;
      await stone.save();
    });
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
    setTimeout(confirmStones, 60000);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
