import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Resume } from "../models/resume.model.js";
import fs from "fs";
import pdf from "pdf-parse-new";
import { analyzeResume } from "../utils/gemini.js";

const uploadResume = asyncHandler(async (req, res) => {
    // 1. Validate File
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Resume file is required."
        });
    }

    const localPath = req.file.path;
    console.log("1 step work");
    try {
        // 2. Get and Validate Body Data
        const { selfDescription, jobDescription, filename } = req.body;

        if (!filename?.trim() || !selfDescription?.trim() || !jobDescription?.trim()) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        console.log("2 step work")
        // 3. Extract PDF Text
        let resumeText;
        try {
            const buffer = fs.readFileSync(localPath);
            const data = await pdf(buffer);
            resumeText = data.text;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid or corrupted PDF file."
            });
        }

         console.log("3 step work")

        // 4. Upload Resume to Cloudinary
        const uploadedResume = await uploadOnCloudinary(localPath);
        if (!uploadedResume) {
            return res.status(500).json({
                success: false,
                message: "Resume upload failed."
            });
        }

         console.log("4 step work")
        // 5. Call Gemini
        let analysis;
        try {
            analysis = await analyzeResume({
                resumeText,
                selfDescription,
                jobDescription
            });
        } catch (error) {
            return res.status(503).json({
                success: false,
                message: "AI analysis service is temporarily unavailable."
            });
        }

         console.log("5 step work")
        const atsScore = Number(analysis.atsScore) || 0;

        // 6. Save to MongoDB
        const resume = await Resume.create({
            user: req.user._id,
            filename: filename.trim(),
            resumeUrl: uploadedResume,
            selfDescription,
            jobDescription,
            atsScore: atsScore,
            technicalQuestions: analysis.technicalQuestions || [],
            behavioralQuestions: analysis.behavioralQuestions || [],
            skillsGap: analysis.skillsGap || [],
            preparationPlan: analysis.preparationPlan || []
        });

         console.log("6 step work")
        // 7. Send Response
        return res.status(201).json({
            success: true,
            message: "Resume analyzed and uploaded successfully.",
            data: resume
        });

    } finally {
        // Always delete local temporary file to prevent storage leaks
        if (fs.existsSync(localPath)) {
            try {
                await fs.promises.unlink(localPath);
            } catch (unlinkError) {
                console.error(`Failed to delete local file at ${localPath}:`, unlinkError);
            }
        }
    }
});

const getResume = asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id })
        .select("filename atsScore createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        resumes
    });
});

const getResumeById = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();

    if (!id) {
        return res.status(400).json({ success: false, message: "Resume ID is required." });
    }

    const resume = await Resume.findOne({
        _id: id,
        user: req.user._id
    });

    if (!resume) {
        return res.status(404).json({
            success: false,
            message: "Resume not found."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Resume fetched successfully.",
        data: resume
    });
});

const deleteResume = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();

    if (!id) {
        return res.status(400).json({ success: false, message: "Resume ID is required." });
    }

    // Atomically find and delete in a single query
    const resume = await Resume.findOneAndDelete({
        _id: id,
        user: req.user._id
    });

    if (!resume) {
        return res.status(404).json({
            success: false,
            message: "Resume not found."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Resume deleted successfully."
    });
});

export { uploadResume, getResume, getResumeById, deleteResume };