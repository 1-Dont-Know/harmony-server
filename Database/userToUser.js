const express = require("express");
const cookieParser = require("cookie-parser");
const { findUser } = require("./queries/user");
const { findFriends, deleteFriendLink } = require("./queries/userLink");
require("dotenv").config();

const router = express.Router();

router.use(express.json());
router.use(cookieParser());

//endpoints
/**
 * Loads the friends list of a user
 *
 * User 1 is the sender and user 2 is the receiver
 *
 * METHOD: GET
 * CREDENTIALS: TRUE
 * RESPONSE: {success: boolean, message?: string, data?: User[]}
 */
router.get("/loadFriendsList", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const { received, sent } = await findFriends(user);

    res.status(200).json({ success: true, data: [...received, ...sent] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Removes a friend link between a user and another user
 *
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {targetEmail: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/removeFriend", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const target = await findUser(req.body.targetEmail);

    await deleteFriendLink(user, target);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

//router
module.exports = router;
