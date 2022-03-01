#! /usr/bin/env node

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({ kind: { type: String } });
const User = mongoose.model("User", UserSchema);

console.log("Connection to database...");
mongoose.connect("mongodb://localhost/mpgo");
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => {
  console.log("MongoDB connection opened");

  User.updateMany(
    { kind: { $exists: false } },
    { kind: "LocalUser" },
    (error, res) => {
      if (error) {
        console.log(error);
      } else if (!res.acknowledged) {
        console.log("Something went wrong");
        console.log(res);
      } else {
        console.log(`Updated ${res.modifiedCount} documents.`);
      }
      db.close();
    }
  );
});
