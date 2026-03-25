const socketDeviceValidation = require("../middlewares/socketDevice.middleware.js");
const Device = require("../models/device.model.js");

const registerSocketHandlers = (io) => {
  io.use(socketDeviceValidation);

  io.on("connection", (socket) => {
    console.log("Device Connected: ", socket.device?._id);
    socket.on("join-room", async ({ roomId, otherDeviceId }) => {
      try {
        socket.join(roomId);

        const otherDevice = await Device.findById(otherDeviceId);
        if (!otherDevice) return;

        socket.emit("device_info", {
          device: otherDevice.deviceName,
          user: otherDevice.usedBy,
        });
      } catch (error) {
        console.log("Join room error: ", error.message);
      }
    });

    socket.on("send_location", ({ roomId, location }) => {
      io.to(roomId).emit("recieve-location", {
        sharedBy: socket.user._id,
        device: socket.device.name,
        location,
      });
    });

    socket.on("disconnect", () => {
      console.log("Device is disconnected: ", socket.device?._id);
    });
  });
};

module.exports = registerSocketHandlers;
