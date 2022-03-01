const mongoose = require("mongoose");
const user = require("./users/user");
const StoneSchema = require("./stone").schema;

const transform = (doc, ret) => {
  if (ret.user.kind) {
    ret.userKind = ret.user.kind;
  }
  delete ret.user;
  return ret;
};

// TODO: Color type? Deduplicate color regex? Also used in user.js
const PlayerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    secondaryColor: {
      type: String,
      required: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },
    stones: [StoneSchema],
    confirmedByAdmin: { type: Boolean, default: false },
  },
  {
    toObject: { transform },
    toJSON: { transform },
  }
);

module.exports = mongoose.model("Player", PlayerSchema);
