const { error } = require("console");
const app = require("./src/app.js");
const connectDB = require("./src/config/db.js");
const { createServer } = require("http");
const { Server } = require("socket.io");
const passport = require("passport");


const port = process.env.PORT || 3000;
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5000",
        methods: ["GET", "POST"],
        credentials: true
    }
})

connectDB()
.then(() =>{
     server.listen(port, () => {
      console.log(`Server is listening at http://localhost:${port}`);
    });
})
.catch((error) =>{
    console.log("MongoDb connection failed", error.message);
})
