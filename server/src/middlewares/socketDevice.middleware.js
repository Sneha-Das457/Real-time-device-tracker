const asyncHandler = require("../utils/asyncHandler.js");
const Device = require("../models/device.model.js");

const socketDeviceValidation= async(socket, next) =>{
    try{

        const apiKey = socket.Handshake.auth?.apiKey;

        if(!apiKey){
            return next(new Error("API key is missing"))
        }

        const device = await Device.findOne({ apiKey });

        if(!device){
            return next(new Error("Unauthorized device"));
        }
        socket.user = decodeUser; 
        socket.device = device;
        next();
    }catch(error){
        next(new Error("Authentication failed"))
    }

};

module.exports = socketDeviceValidation;
