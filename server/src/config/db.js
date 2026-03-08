const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Connected to mongoDB sucessfully....`);
  } catch (error) {
    console.log("MongoDB connection error", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
