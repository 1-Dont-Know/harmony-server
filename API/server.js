const http = require("http")
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const apiRoutes = require("./api");

const {setup: socketSetup} = require("../Peer/sockets.cjs")

const port = process.env.PORT || process.env.SERVER_PORT;

const app = express();

const server = http.createServer(app)
const socketIo = require("socket.io");
const userChatSocket = require("../Peer/userChatSocket.js");

app.use(express.json({ limit: "50mb" }));

const io = new socketIo.Server(server, {
  cors: {
    origin: "http://localhost:"+process.env.CLIENT_PORT,
    methods: ["GET", "POST"],
    credentials: true,
    cookie: true
  }
})

userChatSocket(io);
socketSetup({io})

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.secureCookie = (name, val, options = {}) => {
    res.cookie(name, val, {
      sameSite: "strict",
      httpOnly: true,
      secure: true,
      ...options,
    });
  };
  next();
});

app.use(express.static(path.join(__dirname, "../dist")));

app.use(apiRoutes);

app.get("/server/status", (req, res) => {
  res.send("Server is functioning properly.");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

server.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
