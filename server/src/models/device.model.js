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
    apiKey: {
        type: String,
        uniqe: true,
        required: true
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
        longitude: {
            type: Number
        }
    }    
}, { timestamps: true});

deviceSchema.pre("save", function(next) {
    if (!this.apiKey){
        this.apiKey = crypto.randomBytes(32).toString("hex");
    }
    next();
});

const Device = mongoose.model("Device", deviceSchema);
module.exports = Device;