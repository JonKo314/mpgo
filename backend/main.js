const config = require("../config");

const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const CustomStrategy = require("passport-custom").Strategy;
const path = require("path");
const fs = require("fs");

const saltRounds = 10;

const gameRouter = require("./routes/gameRouter");
const User = require("./models/users/user");
const LocalUser = require("./models/users/local");
const GuestUser = require("./models/users/guest");
const Invitation = require("./models/invitation");
const Notifications = require("./notifications");

// Source: https://github.com/passport/express-4.x-local-example/blob/master/server.js
passport.use(
  new LocalStrategy(async function (username, password, callback) {
    try {
      const user = await LocalUser.findOne({ name: username }).select(
        "+passwordHash"
      );
      const passwordHash = user
        ? user.passwordHash
        : `$2b$${saltRounds}$TakeSomeTimeToCheckEvenIfUsernameIsWrong1234567890123`;

      if (!(await bcrypt.compare(password, passwordHash)) || !user) {
        return callback(null, false, {
          message: "Wrong username or password.",
        });
      }

      delete user._doc.passwordHash;
      return callback(null, user);
    } catch (err) {
      return callback(err);
    }
  })
);

passport.use(
  "guest",
  new CustomStrategy(async function (req, callback) {
    let user = await GuestUser.findOne({ token: req.session.id });
    if (!user) {
      user = await new GuestUser({
        token: req.session.id,
        color: "#123456",
        secondaryColor: "#fedcba",
      }).save();
    }
    return callback(null, user);
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
    secret: config.expressSessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict",
      secure: "auto", // TODO: See https://www.npmjs.com/package/express-session
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/games", gameRouter);

app.post("/login", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
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

app.post("/guestLogin", function (req, res, next) {
  passport.authenticate("guest", (err, user, info) => {
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
    if (req.user) {
      throw new Error("Logout to register");
    }

    const invitation = await Invitation.findById(req.body.invitation);
    if (!invitation || invitation.usedAt) {
      throw new Error("Invalid invitation");
    }

    const credentials = req.body;
    if (await LocalUser.findOne({ name: credentials.username })) {
      // TODO: Restrict registration attempts to prevent automated testing for used names
      throw new Error("Username already taken.");
    }

    invitation.usedAt = new Date();
    await invitation.save();
    // Invitation is now invalid, even if there's an error after this save
    // TODO: Use transactions (sessions?) instead

    const user = await new LocalUser({
      name: credentials.username,
      passwordHash: await bcrypt.hash(credentials.password, saltRounds),
      color: "#123456",
      secondaryColor: "#fedcba",
      // isAdmin defaults to: false
    }).save();
    delete user._doc.passwordHash;

    invitation.user = user;
    invitation.save();

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

app.get("/invitations", async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.sendStatus(403);
  }

  res.json(await Invitation.find().populate("creator").populate("user"));
});

app.post("/invitations/create", async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.sendStatus(403);
  }

  const invitation = new Invitation({
    creator: req.user,
    createdAt: new Date(),
  });
  await invitation.save();
  res.json(invitation);
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

mongoose.connect("mongodb://localhost/mpgo");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", async () => {
  console.log("MongoDB connection opened");
});

const createHttpServer = () => require("http").createServer(app);
const createHttpsServer = () => {
  const key = fs.readFileSync(config.ssl.key);
  const cert = fs.readFileSync(config.ssl.cert);
  return require("https").createServer({ key, cert }, app);
};

const server = config.ssl.enabled ? createHttpsServer() : createHttpServer();
Notifications(server);

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
