const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const cloudinary = require('../cloudinary/cloudinary')
require("dotenv").config();
const router = express.Router();
import { setDeleteUserLinks } from "./queries/userLink";
import { setDeleteTeamLink } from "./queries/teamLink";
import { emailAvailable, setDeleteUser, updateProfilePic, updateUserEmail } from "./queries/user";

const port = 2 + +process.env.SERVER_PORT;

const app = express();

router.use(express.json());
router.use(cookieParser())
router.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
}));


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

//Endpoints

//Private Endpoints
//Authorize JWT
function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (token == null) { return res.sendStatus(401) };
  
    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
      if (err) { console.log(err); return res.sendStatus(403) }
      req.user = user;
      next()
    })
  }
  
  router.use(authenticateToken);

//Delete User
router.post("/deleteUser",
    async function (req, res) {
        try {
            const userID = await findUser(req.user.email);
            
            //remove all teams links
            setDeleteUserLinks(userID)
            setDeleteTeamLink(userID)
            setDeleteUser(userID)

            res.status(200).json({ "success": true })
        } catch (error) {
            console.log(error);
            res.status(500).json({ "success": false, "message": "An error has occurred" });
        }
    }
);

// Update User
router.post("/updateUser", async function (req, res) {
  try {
    const { username, email } = req.body;
    const user = await findUser(email);
    const userId = user.id;

    // Duplicate Email Check
    if (email && email !== req.user.email) {
      const canUseEmail = await emailAvailable(email);

      if (!canUseEmail) {
        res.status(409).json({ success: false, message: "Email already in use" });
        return;
      }
    }

    updateUserEmail(username, email, userId)

    // Update cookie to reflect new email change
    const accessToken = jwt.sign({ "email": user.email, "username": username, "securePassword": user.password }, process.env.JWT_KEY);
    res.secureCookie("token", accessToken);

    res.status(200).json({ success: true, message: "Profile has been updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "success": false, "message": "An error has occurred" });
  }
});

// Verify Peer Connection
router.get("/peer/authenticate", express.json(), async (req, res) => {
  try {
    const queriedUser = findUser(req.user.email)
    const userID = queriedUser.id;

    //get all owned and joined teams
    const {owned, joined} = findJoinedTeams(queriedUser)

    //append teams together
    const teamList = [...owned, ...joined];

    const token = jwt.sign(
      {
        uid: req.user.email,
        username: queriedUser.username,
        groups: teamList.map((team) => team.uid),
      },
      process.env.SIGNALING_KEY,
      { expiresIn: 1 }
    );
    
    res
      .status(200)
      .json({ success: true, message: "peer authorized", data: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

// Upload or update user avatar
router.post("/uploadAvatar", async (req, res) => {
  try {
    const { image, avatarLink } = req.body;
    const userId = await findUser(req.user.email);

    uploadOptions = {
      upload_preset: "unsigned_upload",
      allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
    };

    // Add public ID to 'uploadOptions' if 'avatarLink' exists
    if (avatarLink) {
      // Find the index of the substring 'user-avatar/'
      const startIndex =
        avatarLink.indexOf("user-avatar/") + "user-avatar/".length;

      // Find the index of the end of the substring before the file extension
      const endIndex = avatarLink.lastIndexOf(".");

      // Extract id from 'avatarLink'
      const publicId = avatarLink.substring(startIndex, endIndex);

      uploadOptions.public_id = publicId;
    }

    // Upload image to cloudinary
    const uploadedImage = await cloudinary.uploader.upload(
      image,
      uploadOptions,
      function (error, result) {
        if (error) {
          console.log(error);
        }
        console.log(result);
      }
    );

    // Store avatar URL to database
    updateProfilePic(userId, newPFP)
    console.log(uploadedImage);
    res.status(200).json({ success: true, data: uploadedImage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "success": false, "message": "An error has occurred" });
  }
});

// Delete user avatar
router.delete("/deleteAvatar", async (req, res) => {
  try {
    const { avatarLink } = req.body;
    const userId = await findUser(req.user.email);
    
    if (avatarLink) {
      // Find the index of the substring 'user-avatar/'
      const startIndex = avatarLink.indexOf("user-avatar/");

      // Find the index of the end of the substring before the file extension
      const endIndex = avatarLink.lastIndexOf(".");

      // Extract public id from 'avatarLink'
      const publicId = avatarLink.substring(startIndex, endIndex);

      // Delete image from Cloudinary
      cloudinary.uploader.destroy(publicId, { invalidate: true });

      // Delete image link from database
      updateProfilePic(userId, "")
    }

    res.status(200).json({ success: true, message: "Avatar deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "success": false, "message": "An error has occurred" });
  }
});

// Get user data
router.get("/getUser", async (req, res) => {
  try {
    const user = await findUser(req.user.email);
    const userId = user.id;
      
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "success": false, "message": "An error has occurred" });
  }
});

//Functions
function validatePassword(password) {
    const lengthCheck = password.length >= 12;
    const specialCheck = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    const forbiddenList = ['password', '123', '1234', '12345', '123456'];
    const forbiddenCheck = !forbiddenList.includes(password.toLowerCase());

    return lengthCheck && specialCheck && forbiddenCheck;
}

//router
module.exports = router
