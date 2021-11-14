const express = require("Express");
const mongoose = require("mongoose");
const logger = require("morgan");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const http = require("http");

const saltRounds = 10;

const gameRouter = require("./routes/gameRouter");
const User = require("./models/user");
const Notifications = require("./notifications");

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

app.use(
  require("express-session")({
    secret: "granular synthesis",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict",
      // secure: true, TODO: HTTPS needed
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/games", gameRouter);

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
      color: "#123456",
      secondaryColor: "#fedcba",
      // isAdmin defaults to: false
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

app.post("/setColors", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Not logged in."); // TODO: Find better way to check and respond
    }

    const color = req.body.color;
    const secondaryColor = req.body.secondaryColor;

    if (!color && !secondaryColor) {
      throw new Error("No color provided.");
    }

    if (color) {
      req.user.color = color;
    }

    if (secondaryColor) {
      req.user.secondaryColor = secondaryColor;
    }

    await req.user.save();
    res.sendStatus(200);
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
});

const server = http.createServer(app);
Notifications(server);

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
