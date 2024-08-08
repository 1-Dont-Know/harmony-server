require("dotenv").config();
const express = require("express");
const router = express.Router();
const { sockets } = require("../Peer/sockets.cjs");
const { findUser, findUserById } = require("./queries/user.js");
const {
  canSendFriendRequest,
  canSendTeamRequest,
  findIncomingTeamRequests,
  createTeamRequest,
  findRequest,
  acceptTeamRequest,
  declineRequest,
  createFriendRequest,
  findIncomingFriendRequests,
  acceptFriendRequest,
} = require("./queries/request.js");
const { findTeam } = require("./queries/team.js");

router.use((req, res, next) => {
  req.socket = sockets.get(req.user.email)?.socket;
  next();
});


//Endpoints
/**
 * Creates a team request
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {targetEmail: string, teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/createTeamRequest", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const target = await findUser(req.body.targetEmail);
    const team = await findTeam(req.body.teamUID, req.body.teamName);
    const canSend = await canSendTeamRequest(target, team);
    if (!canSend.result) {
      res.status(400).json({ success: false, message: canSend.message });
      return;
    }
    const dataRaw = { teamName: req.body.teamName, teamUID: req.body.teamUID };
    const data = JSON.stringify(dataRaw);

    await createTeamRequest(user, target, data);

    const receivingSocket = sockets.get(req.body.targetEmail).socket;
    receivingSocket.emit("update:new_team_request", {
      team: req.body.teamName,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Load all incoming team requests
 * METHOD: GET
 * CREDENTIALS: TRUE
 * RESPONSE: {success: boolean, message?: string, data?: Request[]}
 */
router.get("/loadIncomingTeamRequest", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const requests = await findIncomingTeamRequests(user);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Resolves a team request
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {requestUID: string, accepted: boolean}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/resolveIncomingTeamRequest", async function (req, res) {
  try {
    //Accept/Deny Check
    const acceptedCheck = req.body.accepted;

    //Deny Resolve
    if (!acceptedCheck) {
      await declineRequest(req.body.requestUID);

      res.status(200).json({ success: true });
      return;

    } else { //Accept Resolve
      const request = await findRequest(req.body.requestUID);
      if (!request) {
        res.status(400).json({ success: false, message: "Request not found" });
        return;
      }

      const { teamUID: teamUid, teamName } = JSON.parse(request.data);
      const team = await findTeam(teamUid, teamName);

      await acceptTeamRequest(request, team);

      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

//Friends List Endpoints
/**
 * Creates a friend request
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {targetEmail: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/createFriendRequest", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const target = await findUser(req.body.targetEmail);

    if (!target) {
      res
        .status(400)
        .json({ success: false, message: "Target user not found" });
      return;
    }

    const canSend = await canSendFriendRequest(user, target);

    if (!canSend.result) {
      res
        .status(400)
        .json({ success: false, message: canSend.message });
      return;
    }

    await createFriendRequest(user, target);

    const receivingSocket = sockets.get(req.body.targetEmail).socket;
    receivingSocket.emit("update:new_friend_request", {
      username: req.user.username || req.user.email,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Load all incoming friend requests
 * METHOD: GET
 * CREDENTIALS: TRUE
 * RESPONSE: {success: boolean, message?: string, data?: Request[]}
 */
router.get("/loadIncomingFriendRequest", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const requests = await findIncomingFriendRequests(user);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Resolves a friend request
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {requestUID: string, accepted: boolean}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/resolveIncomingFriendRequest", async function (req, res) {
  try {
    //Accept/Deny Check
    const acceptedCheck = req.body.accepted;
    const request = await findRequest(req.body.requestUID);
    const receiver = await findUserById(request.receiverId); // this user
    const sender = await findUserById(request.senderId);

    //Deny Resolve
    if (!acceptedCheck) {
      await declineRequest(req.body.requestUID);

      req.socket
        .to(sockets.get(receiver.email).socket.id)
        .emit("update:reject_friend_request", {
          username: req.user.username || req.user.email,
        });

      res.status(200).json({ success: true });
      return;
    } else { //Accept Resolve
      await acceptFriendRequest(request, sender, receiver);

      // ping sender to update their friends list
      req.socket
        .to(sockets.get(sender.email).socket.id)
        .emit("update:accept_friend_request", {
          username: req.user.username || req.user.email,
        });

      req.socket.emit("update:accept_friend_request", {
        username: req.user.username || req.user.email,
      });

      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

//router
module.exports = router;
