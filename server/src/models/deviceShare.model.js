const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deviceShareSchema = new Schema({
    device: {
        type: Schema.Types.ObjectId,
        ref: "Device",
        required: true,
    },

    sharedWith: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    permissions: {
        type: String,
        enum: ["view", "admin", "edit"],

    }
}, { timestamps: true });

const deviceShare = mongoose.model("deviceShare", deviceShareSchema);
module.exports = deviceShare;