const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const Device = require("../models/device.model.js");
const { default: mongoose } = require("mongoose");
const User = require("../models/user.model.js");

const registerDevice = asyncHandler(async (req, res) => {
  const { deviceName } = req.body;
  if (!deviceName) {
    throw new apiError(400, "Device name is required");
  }

  const userId = req.user._id;
  const device = await Device.create({
    deviceName: deviceName,
    usedBy: userId,
  });

  return res
    .status(200)
    .json(new apiResponse(200, device, "Device registered successfully"));
});

const getMyDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user id");
  }

  const devices = await Device.find({ usedBy: userId });
  return res
    .status(200)
    .json(new apiResponse(200, devices, "Devices fetched successfully"));
});

const getAllDevices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, userId } = req.query;
  const sortBy = req.query.sortBy || "createdAt";
  const sortType = req.query.sortType === "asc" ? 1 : -1;

  const filter = {};
  if (userId) filter.owner = userId;
  if (query) filter.title = { $regex: query, $options: "i" };

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const devices = await Device.find(filter)
    .sort({ [sortBy]: sortType })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  if (devices.length === 0) {
    throw new apiError(400, "No devies found");
  }

  const total = await Device.countDocuments(filter);
  const totalPages = Math.ceil(total / limitNum);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { devices, total, totalPages },
        "All devices fetched successfully",
      ),
    );
});

const getDeviceLocation = asyncHandler(async (req, res) => {
  const { deviceName } = req.body;
  if (!deviceName) {
    throw new apiError(400, "Device name is required");
  }

  const device = await Device.findOne({
    deviceName: deviceName,
  });

  const location = device.lastLocation;
  return res
    .status(200)
    .json(
      new apiResponse(200, location, "Device location fetched sucessfully"),
    );
});

const updateDeviceLocation = asyncHandler(async (req, res) => {
  const { deviceId, latitude, longtitude } = req.body;
  if (!deviceId || !latitude || !longtitude) {
    throw new apiError(400, "All fields are required");
  }

  const device = await Device.findByIdAndUpdate(
    {
      _id: deviceId,
      usedBy: req.user._id,
    },
    {
      lastLocation: {
        latitude: latitude,
        longtitude: longtitude,
      },
      lastOnline: Date.now(),
      status: "online",
    },
    { new: true },
  );

  if (!device) {
    throw new apiError(404, "Device not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, device, "Device location updated successfully"));
});

const deleteDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    throw new apiError(400, "Device id is required");
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw new apiError(404, "Device not found");
  }

  const { userId } = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user id");
  }

  if (device.usedBy.toString() !== userId.toString()) {
    throw new apiError(400, "You are not authorized to delete this device");
  }

  await device.deleteOne();
  return res
    .status(200)
    .json(new apiResponse(200, null, "Device deleted sucessfully"));
});

module.exports = {
    registerDevice,
    getMyDevices,
    getAllDevices,
    getDeviceLocation,
    updateDeviceLocation,
    deleteDevice,
};