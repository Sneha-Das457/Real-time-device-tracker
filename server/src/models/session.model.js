const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    device: {
        type: Schema.Types.ObjectId,
        ref: "Device",
        required: true,
    },

    startLocation: {
        type: String,
        enum: ["Point"],
        coordinates: [Number, Number]
    },

    endLocation: { 
        type: String,
        enum: ["Point"],
        coordinates: [Number, Number],
    },
    startTime: {
        type: Date,
    },

    endTime: {
        type: Date,
    },

    distance: {
        type: Number,
    },

    averageSpeed: {
        type: Number,
    }
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;