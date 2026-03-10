const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    device: {
        type: Schema.Types.ObjectId,
        ref: "Device",
        required: true,
    },
    coordinates: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        enum: ["Point"],

    },
    movingDirection: {
        type: Number,
    }
}, { timestamps: true});

const Location = mongoose.model("Location", LocationSchema);
module.exports = Location;