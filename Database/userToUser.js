const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { findUser } = require("./queries/user");
const { findFriends, deleteFriendLink } = require("./queries/userLink");
require("dotenv").config();

const router = express.Router();

router.use(express.json());
router.use(cookieParser());


router.use((req, res, next) => {
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

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_KEY, (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

router.use(authenticateToken);

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
