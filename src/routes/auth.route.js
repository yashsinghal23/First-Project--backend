import {Router} from "express";
import {userRegister,LoginUser, LogoutUser,refreshAccessToken} from "../controllers/user.controller.js"
import verifyJWT from "../middleware/verifyJWT.js"

const router=Router();

router.route("/register").post(userRegister);

router.route("/login").post(LoginUser);

router.route('/logout').post(verifyJWT,LogoutUser)


router.route("/refresh-token").post(refreshAccessToken);

export default router