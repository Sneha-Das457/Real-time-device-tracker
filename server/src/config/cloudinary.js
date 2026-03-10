const fs = require("fs");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 600000
  
});

const uploadImgToCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    return null;
  }
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    return response;
  } catch (error) {
    console.log("Failed to upload", error.message);
    throw error;
  } finally {
    fs.existsSync(localFilePath) && fs.unlinkSync(localFilePath);
  }
};


module.exports = {
  uploadImgToCloudinary,
};
