const apiError = require("../utils/apiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyUser = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "").trim();
    if (!token) {
      throw new apiError(400, "Access token is missing");
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodeToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new apiError(400, "Invalid Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(400, error.message);
  }
});

module.exports = verifyUser;

