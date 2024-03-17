import { Router }  from "express";
import { registerUser, userLogin, userLogout ,refreshAccessToken} from "../controllers/user.controller.js";
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
router.route("/refresh-token").post(refreshAccessToken);

export default router;