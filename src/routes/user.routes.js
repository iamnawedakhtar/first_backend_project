import { Router }  from "express";
import { registerUser, userLogin, userLogout } from "../controllers/user.controller.js";
import { upload } from "../middleswares/multer.middleware.js";
import { verifyJWT } from "../middleswares/auth.middleware.js";

const router= Router();

router.route("/register").post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
    
         },
        {
            name:'coverImage',
            maxCount:1
    
         }
    ])
    ,registerUser);
// router.route("/login").post(login);  yaha ake diffrent routes par re-direct kr sakte hai

router.route("/login").post(userLogin);

router.route("/logout").post(verifyJWT,userLogout);

export default router;