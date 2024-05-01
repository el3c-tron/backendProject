import { Router } from "express";
import { 
    changePassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    login, 
    logout, 
    refreshAccessToken, 
    register, 
    updateAvatar, 
    updateCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/muler.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    register
);

router.route("/login").post(login);

router.route("/logout").post(verifyJwt, logout);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/changePassword").post(verifyJwt, changePassword);

router.route("/getCurrentUser").get(verifyJwt, getCurrentUser);

router.route("/updateAvatar").patch(
    verifyJwt,
    upload.single("avatar"),
    updateAvatar
);

router.route("/updateCoverImage").post(
    verifyJwt,
    upload.single("coverImage"),
    updateCoverImage
);

router.route("/channel/:username").get(verifyJwt, getUserChannelProfile);

router.route("/history").get(verifyJwt, getWatchHistory);

export default router;