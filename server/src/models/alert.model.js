const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const alertSchema = new Schema({
    device: {
        type: Schema.Types.ObjectId,
        ref: "Device",
        required: true,
    },

    alertType: {
        type: String,
        enum: [
            "device_offline",
            "speed",
            "low_battery",
            "geofence_enter",
            "geofence_exit",


        ],

        required: true,
    },

    message: {
        type: String,
    },

    location: {
        type: String,
        enum: ["Point"],
        coordinates: [Number, Number],
    }
}, { timestamps: true });

const Alert = mongoose.model("Alert", alertSchema);
module.exports = Alert;