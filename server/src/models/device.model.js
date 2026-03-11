const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deviceSchema = new Schema({
    deviceName: {
        type: String,
        required: true,
    },
    usedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["onlinr", "offline"],
        default: "offline",
    },
    lastOnline: {
        type: Date,
    },
    lastLocation: {
        latitude: {
            type: Number,
        },
        longtitude: {
            type: Number
        }
    }    
}, { timestamps: true});

const Device = mongoose.model("Device", deviceSchema);
module.exports = Device;