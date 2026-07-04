import mongoose from "mongoose";
import {User} from "./user.model.js"

const resumeSchema = new mongoose.Schema(
  {
    // User who uploaded the resume
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename:{
         type:String,
         required:[true,"file name is required"]

    },

    // User Inputs
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },

    selfDescription: {
      type: String,
      required: true,
      trim: true,
    },

    resumeUrl: {
      type: String,
      required: true,
    },

    // AI Analysis
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Skills Gap
    skillsGap: [
      {
        skill: {
          type: String,
        },
        reason: {
          type: String,
        },
      },
    ],

    // Technical Questions
    technicalQuestions: [
      {
        question: {
          type: String,
        },
        intention: {
          type: String,
        },
        answer: {
          type: String,
        },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
        },
      },
    ],

    // Behavioral Questions
    behavioralQuestions: [
      {
        question: {
          type: String,
        },
        intention: {
          type: String,
        },
        answer: {
          type: String,
        },
      },
    ],

    // Preparation Plan
    preparationPlan: [
      {
        day: {
          type: Number,
        },

        topic: {
          type: String,
        },

        description: {
          type: String,
        },

        resources: [
          {
            type: String,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model("Resume", resumeSchema);