const apiError = require("../utils/apiError.js");
const apiResponse = require("../utils/apiResponse.js");
const asyncHandler = require("../utils/asyncHandler.js");
const Location = require("../models/location.model.js");
const Device = require("../models/device.model.js");
const { default: mongoose } = require("mongoose");

const createLocation = asyncHandler(async (requ, res) =>{
    const { deviceId, longitude, latitude } = req.body;

    if(!deviceId || !longitude || !latitude){
        throw new apiError(400, "All fields are required");
    }

    const device = await Device.findById(deviceId)
    if(!device){
        throw new apiError(404, "Device not found");
    }

    const location = await Location.create({
        device: deviceId,
        coordinates: [longitude, latitude],
        location: {
            type: "Point",
            coordinates: [longitude, latitude],
        }

    });


    return res.status(201).json(new apiResponse(200, location, "Location created successfully"));

})

const getDeviceLocation = asyncHandler(async (req, res) =>{
    const { deviceId } = req.body;
    if(!deviceId){
        throw new apiError(400, "Device id is required");
    }

    const location = await Location.findOne({
        device: deviceId,
    }).sort({ createdAt: -1 });

    if(!location){
        throw new apiError(404, "Location not found");
    }

    return res.status(200).json(new apiResponse(200, location, "Device location fetched successfully"));
});

const getLocationHistory = asyncHandler(async (req, res) =>{
    const { deviceId, startDate, endDate } = req.body;
    if(!deviceId || !startDate || !endDate){
        throw new apiError(400, "All fields are required");
    }

    const locations = await Location.find({
        device: deviceId,
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),

        }
    })
    .sort({ createdAt: -1})
    .limit(1000);
    return res.status(200).json(new apiResponse(200, locations, "Device location history fetched successfully"));
});


const getNearbyDevices = asyncHandler(async (req, res) =>{
    const { longitude, latitude, radius } = req.body;
    if(!longitude || !latitude || !radius){
        throw new apiError(400, "All fields are required");
    }

    const nearbyDevices = await Location.aggregate([
       {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [Number(longitude), Number(latitude)],
                },
                distanceField: "distance",
                maxDistance: Number(radius),
                spherical: true,
            }
       }
    ])

    if(nearbyDevices.length === 0){
        return res.status(200).json(new apiResponse(200, null, "No nearby devices found"));
    }

    return res.status(200).json(new apiResponse(200, nearbyDevices, "These are all the nearby devices"));
});


const deleteLocationHistory = asyncHandler(async (req, res) =>{
    const { deviceId } = req.body;
    if(!deviceId){
        throw new apiError(400, "Device id is required");
    }

    const device = await Device.findById(deviceId);
    if(!device){
        throw new apiError(404, "Device not found");
    }

    const {userId} = req.user._id;
    if(device.usedBy.toString() !== userId.toString()){
        throw new apiError(403, "You are not authorized to delete this device's location history");
    }

    await Location.deleteMany({
        device: deviceId,
        location: "Point",
        createdAt: {
            $lte: new Date(),
        }
    });

    return res.status(200).json(new apiResponse(200, null, "Device Location history deleted successfully"));
})

module.exports = {

    createLocation,
    getDeviceLocation,
    getLocationHistory,
    getNearbyDevices,
    deleteLocationHistory,
};

