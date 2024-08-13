const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const router = express.Router();
const { findUser } = require("./queries/user.js");
const {
  createTeam,
  findJoinedTeams,
  findTeam,
  removeUserFromTeam,
  changeTeamName,
  deleteTeam,
  findUsersInTeam,
  removeAllTeamLinks,
} = require("./queries/team.js");

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

//Endpoints

/**
 * Create a new team
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/createTeam", async function (req, res) {
  try {
    //Optional: Create a duplicate uid prevention function
    const user = await findUser(req.user.email);
    await createTeam(user, req.body.teamName);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Add a user to a team
 * @deprecated
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {targetEmail: string, teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/addToTeam", async function (req, res) {
  try {
    const target = await findUser(req.body.targetEmail);
    const team = await findTeam(req.body.teamUID, req.body.teamName);

    //optional : create a duplicate checker

    await forceUserIntoTeam(target, team);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Load all teams the user is a member of
 * METHOD: GET
 * CREDENTIALS: TRUE
 * RESPONSE: {success: boolean, message?: string, data?: Team[]}
 */
router.get("/loadJoinedTeams", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const { owned, joined } = await findJoinedTeams(user);

    res.status(200).json({ success: true, data: [...owned, ...joined] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Remove a user from a team (admin only)
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {targetEmail: string, teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/removeTeamLink", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const team = await findTeam(req.body.teamUID, req.body.teamName);

    if (team.ownerId !== user.id) {
      res.status(400).json({ success: false, message: "User is not Owner" });
      return;
    }

    const target = await findUser(req.body.targetEmail);
    await removeUserFromTeam(target, team);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Remove self from a team
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/leaveTeam", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const team = await findTeam(req.body.teamUID, req.body.teamName);

    if (team.ownerId === user.id) {
      res.status(400).json({
        success: false,
        message:
          "Owner cannot remove self. Please transfer ownership or use Delete Team",
      });
      return;
    }

    await removeUserFromTeam(user, team);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Update team name
 * METHOD: POST
 * BODY: {teamUID: string, teamNameNew: string, teamNameOld: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/updateTeamName", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const team = await findTeam(req.body.teamUID, req.body.teamNameOld);

    if (team.ownerId !== user.id) {
      res.status(400).json({
        success: false,
        message: "Only the owner of a team may change its name",
      });
      return;
    }

    await changeTeamName(team, req.body.teamNameNew);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Soft delete a team
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string}
 */
router.post("/deleteTeam", async function (req, res) {
  try {
    const user = await findUser(req.user.email);
    const team = await findTeam(req.body.teamUID, req.body.teamName);

    if (team.ownerId !== user.id) {
      res.status(400).json({
        success: false,
        message: "Only the owner of a team may delete it",
      });
      return;
    }

    //remove team links
    await removeAllTeamLinks(team);

    //delete team
    await deleteTeam(team);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

/**
 * Load all members of a team
 * METHOD: POST
 * CREDENTIALS: TRUE
 * BODY: {teamUID: string, teamName: string}
 * RESPONSE: {success: boolean, message?: string, data?: User[]}
 */
router.post("/loadTeamMemberList", async function (req, res) {
  try {
    const team = await findTeam(req.body.teamUID, req.body.teamName);
    const finalList = await findUsersInTeam(team);

    res.status(200).json({ success: true, data: finalList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

//router
module.exports = router;
