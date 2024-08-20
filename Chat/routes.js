const express = require("express");
const router = express.Router();
const { sockets } = require("../Peer/sockets.cjs");
const { findUser } = require("../Database/queries/user");
const { findJoinedTeam } = require("../Database/queries/team");
const { findTeamChats, createTeamChat, findTeamChat, editTeamChat, deleteTeamChat } = require("../Database/queries/teamChat");

// router.use((req, res, next) => {
//   req.socket = sockets.get(req.user.email)?.socket;
//   next();
// });

/**
 * Loads chats for a team
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string, data?: (TeamChat & {isOwner: boolean})[]}
 */
router.post("/load", async (req, res) => {
  try {
    const { teamUID, teamName } = req.body;
    const user = await findUser(req.user.email);
    const team = await findJoinedTeam(user, teamUID, teamName);

    if (!team) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    const chats = await findTeamChats(team);

    const mappedChats = chats.map(chat => {
      const isOwner = chat.ownerId === user.id;
      return {
        ...chat,
        isOwner,
      }
    })

    res.json({ success: true, data: mappedChats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Creates a new chat
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {message: string, teamUID: string, teamName: string, fileName?: string, fileUID?: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/create", async (req, res) => {
  try {
    const { message, teamUID, teamName, fileName, fileUID } = req.body;
    const user = await findUser(req.user.email);
    const team = await findJoinedTeam(user, teamUID, teamName);

    if (!team) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    await createTeamChat(user, team, message)

    // req.socket.to("online:" + teamUID).emit("update:new_message", {
    //   team: teamUID,
    // });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

router.post("/edit", async (req, res) => {
  try {
    const { chatUID, teamUID, teamName, message } = req.body;
    const user = await findUser(req.user.email);
    const team = await findJoinedTeam(user, teamUID, teamName);
    const chat = await findTeamChat(chatUID);

    if (!team) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    if (!chat) {
      res
        .status(403)
        .json({ success: false, message: "Could not edit message" });
      return;
    }

    if (chat.ownerId !== user.id) {
      res
        .status(403)
        .json({ success: false, message: "User does not have permission to edit this message" });
      return;
    }

    await editTeamChat(chat, message);

    // req.socket.to("online:" + teamUID).emit("update:edited_message", {
    //   team: teamUID,
    // });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { chatUID, teamUID, teamName } = req.body;
    const user = await findUser(req.user.email);
    const team = await findJoinedTeam(user, teamUID, teamName);
    const chat = await findTeamChat(chatUID);

    if (!team) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    if (!chat || chat.deleted) {
      res
        .status(403)
        .json({ success: false, message: "Could not delete message" });
      return;
    }

    if (chat.ownerId !== user.id && team.ownerId !== user.id) {
      res
        .status(403)
        .json({ success: false, message: "User does not have permission to delete this message" });
      return;
    }

    await deleteTeamChat(chat);

    // req.socket.to("online:" + teamUID).emit("update:deleted_message", {
    //   team: teamUID,
    // });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

module.exports = router;
