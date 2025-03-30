const { Server } = require("socket.io");
const http = require("http");

module.exports = (app) => {
  const server = http.createServer(app); // Use existing Express app

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = {};

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log("User Connected:", userId, socket.id);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      if (userId) {
        delete userSocketMap[userId];
        console.log("User Disconnected:", userId, socket.id);
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return { server, io };
};
