const express = require("express");
const {
  findUserChats,
  createUserChat,
  editUserChat,
  deleteUserChat,
} = require("../Database/queries/userChat");
const {
  findUser,
  findUserByUsername,
} = require("../Database/queries/user");
const { usersAreFriends } = require("../Database/queries/userLink");
const router = express.Router();

/**
 * Get all chats between two users
 * METHOD: GET
 * CREDENTIALS: TRUE
 * QUERY: {peerUsername: string}
 * RESPONSE: {success: boolean, message?: string, data?: UserChat[]}
 */
router.get("/load", async (req, res) => {
  const { peerUsername } = req.query;
  try {
    const user = await findUser(req.user.email);
    const target = await findUserByUsername(peerUsername);
    const areFriends = await usersAreFriends(user, target.id);
    if (!areFriends) {
      res
        .status(400)
        .json({ success: false, message: "Target user not found" });
      return;
    }

    const messages = await findUserChats(user, target, { sortOrder: "asc" });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fail to fetch chat messages" });
  }
});

/**
 * Get all chats between two users
 * METHOD: GET
 * CREDENTIALS: TRUE
 * QUERY: {peerUsername: string}
 * RESPONSE: {success: boolean, message?: string, data?: UserChat[]}
 */
router.get("/loadlatest", async (req, res) => {
  const { peerUsername } = req.query;
  try {
    const user = await findUser(req.user.email);
    const target = await findUserByUsername(peerUsername);
    const areFriends = await usersAreFriends(user, target.id);

    if (!areFriends) {
      res
        .status(400)
        .json({ success: false, message: "Target user not found" });
      return;
    }

    const messages = await findUserChats(user, target, {
      sortOrder: "desc",
      limit: 1,
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fail to fetch chat messages" });
  }
});

/**
 * Send a message between two users
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {userReciever: number, message: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/send", async (req, res) => {
  const { userReciever, message } = req.body;
  try {
    const user = await findUser(req.user.email);
    const target = await findUserByUsername(userReciever);
    const areFriends = await usersAreFriends(user, target.id);

    if (!areFriends) {
      res
        .status(400)
        .json({ success: false, message: "Target user not found" });
      return;
    }

    await createUserChat(user, target, message);

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error inserting message:", error);
    res.status(500).json({ error: "Fail to update messages to database" });
  }
});

/**
 * Edit a message between two users
 * METHOD: PUT
 * CREDENTIALS: TRUE
 * BODY: {userChatId: number, message: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.put("/edit", async (req, res) => {
  try {
    const { userChatId, message } = req.body;
    const user = await findUser(req.user.email);

    if (!userChatId) {
      res
        .status(403)
        .json({ success: false, message: "Error: Missing chatID" });
      return;
    }

    await editUserChat(user, userChatId, message);
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Fail to update message" });
  }
});

/**
 * Soft delete a message between two users
 * METHOD: PUT
 * CREDENTIALS: TRUE
 * BODY: {userChatId: number}
 * RESPONSE: {success: boolean, message?: string}
 */
router.put("/delete", async (req, res) => {
  try {
    const { userChatId } = req.body;
    const user = await findUser(req.user.email);

    // Check if userChatId is provided
    if (!userChatId) {
      return res
        .status(403)
        .json({ success: false, message: "Error: Missing chatID" });
    }

    // Update the database to mark the message as deleted
    await deleteUserChat(user, userChatId);

    // Send success response
    res.json({ success: true });
  } catch (error) {
    // Handle errors
    console.error("Error deleting message:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete message" });
  }
});

module.exports = router;
