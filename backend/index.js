const express = require("Express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("morgan");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const saltRounds = 10;

const User = require("./models/user");
const Stone = require("./models/stone");
const GameState = require("./models/gameState");
const GameLogic = require("./gameLogic");

// Source: https://github.com/passport/express-4.x-local-example/blob/master/server.js
passport.use(
  new LocalStrategy(async function (username, password, callback) {
    try {
      const user = await User.findOne({ name: username }).select(
        "+passwordHash"
      );
      const passwordHash = user
        ? user.passwordHash
        : `$2b$${saltRounds}$TakeSomeTimeToCheckEvenIfUsernameIsWrong1234567890123`;
      delete user._doc.passwordHash;

      if (!(await bcrypt.compare(password, passwordHash)) || !user) {
        return callback(null, false, {
          message: "Wrong username or password.",
        });
      }

      return callback(null, user);
    } catch (err) {
      return callback(err);
    }
  })
);

passport.serializeUser(function (user, callback) {
  callback(null, user._id);
});

passport.deserializeUser(function (id, callback) {
  User.findById(id, function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
});

const app = express();
const port = 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(cors({ origin: true, credentials: true })); // TODO: Is this secure?

app.use(
  require("express-session")({
    secret: "granular synthesis",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }, TODO: HTTPS needed
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(info.message));
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      return res.json(user);
    });
  })(req, res, next);
});

app.get("/checkLogin", function (req, res, next) {
  return res.json(req.user ? req.user : null);
});

app.get("/logout", function (req, res) {
  req.logout();
  res.sendStatus(200);
});

app.post("/register", async (req, res, next) => {
  try {
    const credentials = req.body;
    if (await User.findOne({ name: credentials.username })) {
      // TODO: Restrict registration attempts to prevent automated testing for used names
      throw new Error("Username already taken.");
    }

    const user = await new User({
      name: credentials.username,
      passwordHash: await bcrypt.hash(credentials.password, saltRounds),
    }).save();
    delete user._doc.passwordHash;

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      res.json(user);
    });
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
