import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.services.js";


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 * @body { username, email, password }
 */
export async function register(req, res) {

    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { email }, { username } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User with this email or username already exists",
            success: false,
            err: "User already exists"
        })
    }

    const user = await userModel.create({ username, email, password })

    const emailVerificationToken = jwt.sign({
        email: user.email,
    }, process.env.JWT_SECRET)

    await sendEmail({
        to: email,
        subject: "Welcome to NexChat!",
    html: `
    <p>Hi <strong>${username}</strong>,</p>

    <p>Welcome to <strong>NexChat</strong>! 🎉</p>

    <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>

    <p>
        <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">
            ✅ Verify My Email
        </a>
    </p>

    <p>This link will verify your account and you'll be ready to go!</p>

    <p>If you didn't create this account, you can safely ignore this email.</p>

    <br/>
    <p>Regards,<br/>
    <strong>The NexChat Team</strong></p>
`
    })

    res.status(201).json({
        message: "User registered successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
}

/**
 * @desc Login user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 * @body { email, password }
 */
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        })
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie("token", token, {
    httpOnly: true,
    secure: false,        // dev ke liye
    sameSite: "lax"
})

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @desc Get current logged in user's details
 * @route GET /api/auth/get-me
 * @access Private
 */
export async function getMe(req, res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}


/**
 * @desc Verify user's email address
 * @route GET /api/auth/verify-email
 * @access Public
 * @query { token }
 */
export async function verifyEmail(req, res) {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found"
            })
        }

        user.verified = true;

        await user.save();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verified</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            min-height: 100vh;
            background-color: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
            color: #f4f4f5;
            padding: 20px;
        }

        .card {
            background: #18181b;
            border: 1px solid rgba(49, 184, 198, 0.3);
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 460px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }

        .icon {
            width: 72px;
            height: 72px;
            background: rgba(49, 184, 198, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
        }

        h1 {
            font-size: 26px;
            font-weight: 700;
            color: #31b8c6;
            margin-bottom: 12px;
        }

        p {
            font-size: 15px;
            color: #a1a1aa;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        a {
            display: inline-block;
            background: #31b8c6;
            color: #09090b;
            font-weight: 600;
            font-size: 15px;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            transition: background 0.2s;
        }

        a:hover { background: #45c7d4; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">✅</div>
                <h1>Email Verified!</h1>
                <p>Your email has been verified successfully.<br/>You can now log in to your account.</p>
                <a href="http://localhost:5173/login">Go to Login</a>
            </div>
        </body>
        </html>
`
return res.send(html);

        return res.send(html);
    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
    }
}

/**
 * @desc Logout user and clear auth cookie
 * @route POST /api/auth/logout
 * @access Private/Public (safe to call either way)
 */
export async function logout(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    })

    res.status(200).json({
        message: "Logout successful",
        success: true
    })
}