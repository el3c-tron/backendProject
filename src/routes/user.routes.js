import { Router } from "express";
import { register } from "../controllers/user.controller.js";
import { upload } from "../middlewares/muler.middleware.js"

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

export default router;