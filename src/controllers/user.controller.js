import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Reusable cookie options generator
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
});

const userRegister = asyncHandler(async (req, res) => {
    const { username, email, password, fullname } = req.body;

    // 1. Validate request body
    if ([username, email, password, fullname].some((field) => !field?.trim())) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    });

    if (existedUser) {
        return res.status(409).json({
            success: false,
            message: "User with this username or email already exists"
        });
    }

    // 3. Create and save the user
    const user = await User.create({
        username: normalizedUsername,
        email: normalizedEmail,
        fullname: fullname.trim(),
        password
    });

    // 4. Sanitize data before sending response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while registering the user"
        });
    }

    // 5. Send success response
    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: createdUser
    });
});

const LoginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    // Step 1: Check if user is registered
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid user credentials"
        });
    }

    // Step 2: Check user password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        return res.status(401).json({
            success: false,
            message: "Invalid user credentials"
        });
    }

    // Step 3: Generate and save tokens
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        return res
            .status(200) // Changed from 201 to 200 for a standard login response
            .cookie("accessToken", accessToken, getCookieOptions())
            .cookie("refreshToken", refreshToken, getCookieOptions())
            .json({
                success: true,
                message: "User logged in successfully",
                data: createdUser
            });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to complete login processing."
        });
    }
});

const LogoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            { $set: { refreshToken: undefined } },
            { new: true }
        );

        return res
            .status(200)
            .clearCookie("accessToken", getCookieOptions())
            .clearCookie("refreshToken", getCookieOptions())
            .json({
                success: true,
                message: "User logged out successfully"
            });

    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token is missing"
        });
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token (User not found)"
            });
        }

        if (incomingRefreshToken !== user.refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is expired or altered"
            });
        }

        const newAccessToken = await user.generateAccessToken();
        const newRefreshToken = await user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, getCookieOptions())
            .cookie("refreshToken", newRefreshToken, getCookieOptions())
            .json({
                success: true,
                message: "Access token refreshed successfully",
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error?.message || "Refresh token expired or invalid"
        });
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Current user fetched successfully",
        data: req.user
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { username, email, fullname } = req.body;
    const updateFields = {};

    if (fullname?.trim()) updateFields.fullname = fullname.trim();
    
    if (username?.trim()) {
        const normalizedUsername = username.trim().toLowerCase();
        // Check availability
        const duplicateUsername = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user._id } });
       if (duplicateUsername) {
            return res.status(409).json({ success: false, message: "Username is already taken" });
        }
        updateFields.username = normalizedUsername;
    }

    if (email?.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        // Check availability
        const duplicateEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
        if (duplicateEmail) {
            return res.status(409).json({ success: false, message: "Email is already in use" });
        }
        updateFields.email = normalizedEmail;
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
            success: false,
            message: "No fields provided for update"
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Old password and new password are required"
        });
    }

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        return res.status(400).json({
            success: false,
            message: "Old password is incorrect"
        });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
});

export {
    userRegister,
    LoginUser,
    LogoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateProfile,
    changePassword
};