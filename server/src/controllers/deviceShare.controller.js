const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const deviceShare = require("../models/deviceShare.model.js");
const Device = require("../models/device.model.js");

const shareDevice = asyncHandler(async (req, res) => {
  const { deviceId, sharedWithId, permissions } = req.body;
  if (!deviceId || !sharedWithId || !permissions) {
    throw new apiError(400, "All fields are required");
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw new apiError(404, "Device not found");
  }

  const existingShare = await deviceShare.findOne({
    device: deviceId,
    sharedWith: sharedWithId,
  });

  if (existingShare) {
    await existingShare.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Sharing stopped successfully"));
  }

  const newShare = await deviceShare.create({
    device: deviceId,
    sharedWith: sharedWithId,
    permissions: permissions,
  });

  return res
    .status(200)
    .json(new apiResponse(200, newShare, "Device shared successfully"));
});

/*const getSharedDevices = asyncHandler(async (req, res) =>{
    const userId = req.user._id;
    const sharedDevices = await deviceShare.find({
        sharedWith: userId
    }).populate("device", "name description");

    return res.status(200).json(new apiResponse(200, sharedDevices, "shared devices retrieved successfully"));
});*/

const getDeviceShares = asyncHandler(async (req, res) => {
  const deviceId = req.params.deviceId;
  const shares = await deviceShare
    .find({
      device: deviceId,
    })
    .populate("sharedWith", "name email");

    const totalShares = shares.length;

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        shares,
        totalShares,
        "These are the users, this device shared with",
      ),
    );
});
