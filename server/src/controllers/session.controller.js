const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const Session = require("../models/session.model.js");
const Device = require("../models/device.model.js");
const Location = require("../models/location.model.js");
const { default: mongoose } = require("mongoose");

const startSession = asyncHandler(async (req, res) => {
  const { deviceId, longitude, latitude } = req.body;
  if (!deviceId || !longitude || !latitude) {
    throw new apiError(400, "All fields are required");
  }

  const device = await Device.findById(deviceId);
  if (!mongoose.Types.ObjectId.isValid(deviceId) || !device) {
    throw new apiError(400, "Device not found");
  }

  const session = await Session.create({
    device: deviceId,
    startLocation: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    startTime: Date.now(),
  });

  return res
    .status(200)
    .json(new apiResponse(200, session, "Session started successfully"));
});

const endSession = asyncHandler(async (req, res) => {
  const { sessionId, longitude, latitude } = req.body;
  if (!sessionId || !longitude || !latitude) {
    throw new apiError(400, "All fields are required");
  }

  const session = await Session.findById(sessionId);
  if (!mongoose.Types.ObjectId.isValid(sessionId) || !session) {
    throw new apiError(400, "Session not found");
  }

  const startLocation = session.startLocation.coordinates;
  const endLocation = [longitude, latitude];
  const distance = Location.calculateDistance(startLocation, endLocation);
  const timeDiff = (Date.now() - session.startTime) / 1000;

  const avgSpeed = distance / timeDiff;

  session.endLocation = {
    type: "Point",
    coordinates: endLocation,
  };
  session.endTime = Date.now();
  session.distance = distance;
  session.averageSpeed = avgSpeed;
  await session.save();

  return res
    .status(200)
    .json(new apiResponse(200, session, "Session ended successfully"));
});

const getSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new apiError(400, "Invalid session Id");
  }

  const session = await Session.findById(sessionId).populate(
    "device",
    "startLocation endLocation startTime endTime ",
  );

  if (!session) {
    throw new apiError(400, "Session not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, session, "Session retrieved successfully"));
});

const getAllSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const sortBy = req.query.sortBy || "createdAt";
  const sortType = req.query.sortType === "asc" ? 1 : -1;

  const filter = {};
  if (userId) filter.owner = userId;
  if (query) filter.title = { $regex: query, $options: "i" };

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const sessions = await Session.find(filter)
    .sort({ [sortBy]: sortType })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    if(sessions.length === 0){
        throw new apiError(400, "No session found");
    }

    return res.status(200).json(new apiResponse(200, sessions, "Sessions fetched successfully"));
});

const deleteSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new apiError(400, "Invalid session Id");
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new apiError(400, "Session not found");
  }

  const deviceId = session.device;
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new apiError(400, "Device not found");
  }

  const userId = device.usedBy;
  if (userId.toString() !== req.user._id.toString()) {
    throw new apiError(400, "Unauthorized to delete this session");
  }

  await session.deleteOne();

  return res
    .status(200)
    .json(new apiResponse(200, null, "Session deleted successfully"));
});


module.exports = {
    startSession,
    endSession,
    getSession,
    getAllSessions,
    deleteSession
};

