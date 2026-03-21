const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationShareSchema = new Schema(
  {
    device: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },

    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sharedWith: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shareType: {
      type: String,
      enum: ["live", "static"],
      default: "live",
    },

    permission: {
      type: String,
      enum: ["view", "share"],
      default: "view",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

locationShareSchema.index({ device: 1, sharedWith: 1 });

const locationShare = mongoose.model("locationShare", locationShareSchema);
module.exports = locationShare;
