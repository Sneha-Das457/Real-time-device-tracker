const socketDeviceValidation = require("../middlewares/socketDevice.middleware.js");
const Device = require("../models/device.model.js");

const registerSocketHandlers = (io) => {
  io.use(socketDeviceValidation);

  io.on("connection", async (socket) => {
    console.log("Device Connected:", socket.device?._id);

    await Device.findByIdAndUpdate(socket.device._id, {
      status: "online",
    });

    socket.on("join-room", async ({ roomId, otherDeviceId }) => {
      try {
        socket.join(roomId);

        const otherDevice = await Device.findById(otherDeviceId);
        if (!otherDevice) return;

        socket.emit("device-info", {
          device: otherDevice.deviceName,
          user: otherDevice.usedBy,
        });
      } catch (error) {
        console.log("Join room error:", error.message);
      }
    });

    socket.on("send_location", async ({ roomId, location }) => {
      try {
        await Device.findByIdAndUpdate(socket.device._id, {
          lastLocation: location,
          lastUpdated: new Date(),
        });

        io.to(roomId).emit("receive-location", {
          sharedBy: socket.user._id,
          device: socket.device.deviceName,
          location,
        });
      } catch (err) {
        console.log("Location error:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      await Device.findByIdAndUpdate(socket.device._id, {
        status: "offline",
        lastSeen: new Date(),
      });

      console.log("Device disconnected:", socket.device?._id);
    });
  });
};

module.exports = registerSocketHandlers;
