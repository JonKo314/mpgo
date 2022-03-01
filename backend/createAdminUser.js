#! /usr/bin/env node

const User = require("./models/users/user");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

console.log("Connection to database...");
mongoose.connect("mongodb://localhost/mpgo");
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => {
  console.log("MongoDB connection opened");

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl._writeToOutput = (stringToWrite) => {
    if (rl.stdoutMuted && stringToWrite !== "\n" && stringToWrite !== "\r\n") {
      rl.output.write("*");
    } else {
      rl.output.write(stringToWrite);
    }
  };

  rl.question("Username: ", (username) => {
    rl.question("Password: ", (password) => {
      rl.stdoutMuted = false;
      User.findOne({ name: username }, (error, user) => {
        if (error) throw error;
        if (user) throw new Error("Username already taken.");

        const saltRounds = 12;
        new User({
          name: username,
          passwordHash: bcrypt.hashSync(password, saltRounds),
          color: "#123456",
          secondaryColor: "#fedcba",
          isAdmin: true,
        }).save((error, user) => {
          if (error) throw error;

          console.log(`User ${user.name} created (id: ${user._id})`);
          db.close();
          rl.close();
        });
      });
    });
    rl.stdoutMuted = true; // Acitvate right after question is asked
  });
});
