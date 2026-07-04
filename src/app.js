import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
const app=express();

app.use(helmet());

// General API rate limiter - applies to all requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});

// Stricter limiter for auth endpoints (login/register) to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later."
  }
});

app.use('/api/', apiLimiter);



app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));

// Health check endpoint - for uptime monitoring / host health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

import AuthRouter from "./routes/auth.route.js"
import ResumeRouter from "./routes/resume.route.js"
import UserRouter from "./routes/user.route.js"


app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth',AuthRouter);
app.use('/api/resume',ResumeRouter);
app.use('/api/user',UserRouter)



app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success:false,
        message: err.message || "Internal Server Error"
    });
});
export default app;
