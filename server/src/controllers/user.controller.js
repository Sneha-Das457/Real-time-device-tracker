const apiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const upload = require("../middlewares/multer.middleware.js");
const { uploadImgToCloudinary } = require("../config/cloudinary.js");

const generateAccessAndrefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName } = req.body;
  if (!fullName || !email || !password || !userName) {
    throw new apiError(400, "All fields are required");
  }
  const checkExistingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (checkExistingUser) {
    throw new apiError(409, "User already exist");
  }
  const profileLocalPath = req.file?.path;
  if (!profileLocalPath) {
    throw new apiError(400, "Profile path is required");
  }

  const profile = await uploadImgToCloudinary(profileLocalPath);
  if (!profile.secure_url || !profile.public_id) {
    throw new apiError(409, "Failed to upload profile, try again later");
  }

  const user = await User.create({
    fullName,
    email,
    profile: profile.url,
    profilePublicId: profile.public_id,
    userName,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new apiError(400, "Something went wrong, try again later");
  }

  return res
    .status(200)
    .json(new apiResponse(200, createdUser, "User registered sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new apiError(400, "Username and email is required");
  }
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(400, "Password is incorrect");
  }

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const { accessToken, refreshToken } = await generateAccessAndrefreshToken(
    user._id,
  );

  const option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json(new apiResponse(200, { user: loggedInUser }, "Login successfull"));
});

const getExistingUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new apiError(400, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "This is you profile"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true },
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new apiResponse(200, "", "User loggedout successfull!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const receivedRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!receivedRefreshToken) {
    throw new apiError(404, "Unauthorized request");
  }

  try {
    const decodeToken = jwt.verify(
      receivedRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodeToken._id);
    if (!user) {
      throw new apiError(400, "Token is invalid");
    }

    if (receivedRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is invalid");
    }

    const option = {
      httpOnly: true,
      secure: false,
    };

    const { newaccessToken, newRefreshToken } =
      await generateAccessAndrefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", newaccessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(new apiResponse(200, "Access token is refreshed"));
  } catch (error) {
    throw new apiError(500, error.message);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user._id);
  const checkPassword = await user.isPasswordCorrect(oldPassword);
  if (!checkPassword) {
    throw new apiError(400, "Incorrect Password");
  }
  if (newPassword !== confirmPassword) {
    throw new apiError(400, "New password and confrim password must be same");
  }

  user.newPassword = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, "Password changed sucessfully"));
});

const updateAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { email, userName, fullName } = req.body;
  if (!email || !userName) {
    throw new apiError(400, "All fields are required");
  }

  const checkExistingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!checkExistingUser) {
    throw new apiError(400, "User does not exist");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        email,
        userName,
        fullName,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user,
        "Your account details has been updated successfully",
      ),
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const profileLocalPath = req.file?.path;
  const userId = req.user._id;
  if (!profileLocalPath) {
    throw new apiError(400, "Profile is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.profilePublicId) {
    try {
      await cloudinary.uploader.destroy(user.profilePublicId, {
        resource_type: "image",
      });
    } catch (error) {
      throw new apiError(500, "Something went wrong during the process");
    }
  }

  const profile = await uploadImgToCloudinary(profileLocalPath);
  if (!profile.secure_url || !profile.public_id) {
    throw new apiError(400, "Failed to upload image, try again later");
  }

  const updateUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profile: profile.secure_url,
        profilePublicId: profile.public_id,
      },
    },
    { new: true },
  );
  return res
    .status(200)
    .json(new apiResponse(200, updateUser, "Profile updated successfully"));
});

const removeProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User does not exist!");
  }

  if (!user.profilePublicId) {
    throw new apiError(400, "There is no profile to remove");
  }
  try {
    await cloudinary.uploader.destroy(user.profilePublicId, {
      resource_type: "image",
    });
  } catch (error) {
    throw new apiError(500, "Something went wrong during the process");
  }

  user.profile = "";
  user.profilePublicId = "";
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, "Your profile has been removed sucessfully"));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.body) {
    throw new apiError(404, "Request body is missing");
  }
  const { password } = req.body;
  if (!password) {
    throw new apiError(404, "Password is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found!");
  }

  const checkPassword = await user.isPasswordCorrect(password);
  if (!checkPassword) {
    throw new apiError(400, "Incorrect Password");
  }

  const deletedUser = await User.findByIdAndDelete(userId);
  return res
    .status(200)
    .json(
      new apiResponse(200, deletedUser, "Account has been deleted sucessfully"),
    );
});

module.exports = {
    registerUser,
    loginUser,
    getExistingUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateAccount,
    updateProfile,
    removeProfile,
    deleteAccount,
};