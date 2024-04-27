import { Router } from "express";
import { login, logout, refreshAccessToken, register } from "../controllers/user.controller.js";
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

export default router;