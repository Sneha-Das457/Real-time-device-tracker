const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const locationShare = require("../models/locationShare.model.js");
const Device = require("../models/device.model.js");
const Location = require("../models/location.model.js");

const startLocationShare = asyncHandler(async (req, res) => {
  try {
    const { deviceId, sharedWithId, shareType, duration } = req.body;
    if (!deviceId || !sharedWithId || !shareType || !duration) {
      throw new apiError(400, "All Fields are required");
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      throw new apiError(400, "Device not found");
    }

    const userId = req.user._id;
    const owner = device.usedBy.toString() === userId.toString();

    let hasAccess = false;
    if (owner) {
      hasAccess = true;
    } else {
      const access = await locationShare.findOne({
        device: deviceId,
        sharedWith: userId,
        isActive: true,
        expiresAt: { $gt: new Date() },
        permission: "share",
      });

      if (access) {
        hasAccess: true;
      }
    }

    if (!access) {
      throw new apiError(400, "You are not allowed to share this");
    }

    const expiresAt = new Date(Date.now() + duration);

    const existingShare = await locationShare.findOne({
      device: deviceId,
      sharedBy: owner,
      sharedWith: sharedWithId,
      isActive: true,
    });

    if (existingShare) {
      throw new apiError(400, "Already started sharing");
    }
    const newShare = await locationShare.create({
      device: deviceId,
      sharedBy: owner,
      sharedWith: sharedWithId,
      shareType: shareType,
      isActive: true,
      expiresAt: expiresAt,
    });

    return res
      .status(200)
      .json(new apiResponse(200, newShare, "Location sharing started"));
  } catch (error) {
    res.status(500).json(new apiResponse(500, "", error.message));
  }
});

const stopSharing = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  const share = await locationShare.findById(share);
  if (!share) {
    throw new apiError(400, "No share found");
  }

  if (share.sharedBy.toString() !== req.user._id.toString()) {
    throw new apiError(400, "Unauthorized to do this");
  }

  share.isActive = false;
  await share.save();

  return res
    .status(200)
    .json(new apiResponse(200, null, "Location sharing stopped"));
});

const getLiveLocation = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const userId = req.user._id;

  const share = await locationShare.findOne({
    device: deviceId,
    sharedWith: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!share) {
    throw new apiError(400, "You are not allowed");
  }

  const location = await Location.findOne({
    device: deviceId,
  })
    .sort({ createdAt: -1 })
    .select("latitude longitude createdAt");

  if (!location) {
    throw new apiError(400, "No data found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, location, "Live location has been fetched"));
});

const locationSharedwithMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sharedwithMe = await locationShare
    .find({
      sharedWith: userId,
      isActive: true,
    })
    .populate("sharedBy device isActive");

  if (sharedwithMe.length === 0) {
    throw new apiError(400, "No location found that shared with you");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        sharedwithMe,
        "All location that shared with you has been fetched",
      ),
    );
});

const locationSharedbyMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sharedbyMe = await locationShare
    .find({
      sharedBy: userId,
    })
    .populate("sharedWith device isActive");

  if (sharedbyMe.length === 0) {
    throw new apiError(400, "No location data found that you shared");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        sharedbyMe,
        "All the location data you shared has been fetched",
      ),
    );
});

const extenedLocationShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { extendTime } = req.body;

  const share = await locationShare.findById(shareId);
  if (!share) {
    throw new apiError(400, "No share found");
  }

  if (share.sharedBy.toString() !== req.user._id.toString()) {
    throw new apiError(400, "Unauthorized to do this");
  }

  share.expiresAt = new Date(share.expiresAt.getTime() + extendTime);
  await share.save();

  res.status(200).json(new apiResponse(200, null, "Sharing time extended"));
});

module.exports = {
  startLocationShare,
  startLocationShare,
  getLiveLocation,
  locationSharedwithMe,
  locationSharedbyMe,
  extenedLocationShare,
};
