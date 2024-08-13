const http = require("http")
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const apiRoutes = require("./api");

const {setup: socketSetup} = require("../Peer/sockets.cjs")

const port = process.env.PORT || process.env.SERVER_PORT;
const clientOriginWhitelist = process.env.CLIENT_ORIGIN.split("|").map(a=>a.trim())

const app = express();

const server = http.createServer(app)
const socketIo = require("socket.io");
const userChatSocket = require("../Peer/userChatSocket.js");

app.use(express.json({ limit: "50mb" }));

const corsOrigin = {
  origin: (origin, callback) => {
    if (clientOriginWhitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback()
    }
  }
}

const io = new socketIo.Server(server, {
  cors: {
    methods: ["GET", "POST"],
  }
})

userChatSocket(io);
socketSetup({io})

app.use(express.json());
app.use(cookieParser());
app.use(cors());

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
