const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    userID: { type: String, require: true, unique: true },
    serverID: { type: String, require: true },
    balance: { type: Number, default: 100 },
    lastUsed: { type: Number, default: 0 },
    dailyLastUsed: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
});

const model = mongoose.model("doubloons", profileSchema);

module.exports = model;