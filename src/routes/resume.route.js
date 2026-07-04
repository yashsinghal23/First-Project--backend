import { Router } from "express";
import { uploadResume } from "../controllers/resume.controller.js";
import verifyJWT  from "../middleware/verifyJWT.js";
import upload from "../middleware/multer.middleware.js"
import { getResume } from "../controllers/resume.controller.js";
import { getResumeById } from "../controllers/resume.controller.js";
import { deleteResume } from "../controllers/resume.controller.js";

const router = Router();

router.post("/upload", verifyJWT,upload.single('resume'), uploadResume);
router.get("/history",verifyJWT,getResume)

router.get("/:id",verifyJWT,getResumeById)

router.delete("/delete/:id",verifyJWT,deleteResume)
export default router;