const jwt = require("jsonwebtoken");
const peerServer = require("./signaling.cjs");
const updates = require("./updates.cjs");
const { findJoinedTeams } = require("../Database/queries/team");
const { findUser } = require("../Database/queries/user");

/**
 * @typedef {import("socket.io").Server} SocketIoServer
 * @typedef {{socket: SocketIoSocket, currentRoom: string | null}} UserData
 */

/**
 * @type {Map<[userEmail: string], UserData}
 */
const uidMap = new Map();

/**
 * @param {{io: SocketIoServer}} param0
 */
function setup({ io }) {
  io.use((socket, next) => {
    if (!socket.handshake.auth.token) {
      return next(new Error("Invalid Token"))
    }

    const token = socket.handshake.auth.token;

    if (token == null) {
      return next(new Error("Invalid Token"));
    }

    jwt.verify(token, process.env.JWT_KEY, async (err, user) => {
      if (err) {
        console.log(err);
        return next(new Error("Invalid Token"));
      }
      try {
        const dbUser = await findUser(user.email);
        if (!dbUser) {
          return next(new Error("Invalid Token"));
        }
        const {owned, joined} = await findJoinedTeams(dbUser);

        //append teams together
        const teamList = [...owned, ...joined].map(
          (team) => team.uid
        );

        socket.data.user = {
          uid: dbUser.email,
          username: dbUser.username,
          groups: teamList,
        };
        next();
      } catch (error) {
        console.error("Error getting socket user data: ", error);
        next(new Error("Error getting socket user data"));
      }
    });
  });

  const { sockets } = peerServer(io);

  updates(io, sockets, uidMap);
}

module.exports = { sockets: uidMap, setup };
