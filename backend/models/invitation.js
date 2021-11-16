const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date },
  usedAt: { type: Date },
});

module.exports = mongoose.model("Invitation", InvitationSchema);
