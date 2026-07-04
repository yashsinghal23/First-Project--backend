import {Router} from "express";
import verifyJWT from "../middleware/verifyJWT.js"
import {getCurrentUser, updateProfile, changePassword} from "../controllers/user.controller.js"

const router=Router();

router.get('/me',verifyJWT,getCurrentUser)

router.patch('/updateProfile',verifyJWT,updateProfile)

router.patch('/changePassword',verifyJWT,changePassword)

export default router 