import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import pool from "../database.js";
import { verifyAuth } from "../middleware/jwt.js";

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const isLocalhost = FRONTEND_URL.includes("localhost");

function cookieOptions() {
    return {
        httpOnly: true,
        secure: !isLocalhost,
        sameSite: isLocalhost ? "lax" : "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}

// login / signup
router.post("/login", async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: "Missing Google credential" });
    }

    // 1. Verify the Google ID token
    let ticket;
    try {
        ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
    } catch (err) {
        console.error("[Auth] Google token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // 2. Upsert the user in the database
    let userID;
    try {
        const result = await pool.query(
            `INSERT INTO users (google_id, email, name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
                 SET email      = EXCLUDED.email,
                     name       = EXCLUDED.name,
                     avatar_url = EXCLUDED.avatar_url,
                     updated_at = NOW()
             RETURNING user_id, google_id, email, name, avatar_url, created_at`,
            [googleId, email, name, picture]
        );
        userID = result.rows[0].user_id;
    } catch (err) {
        console.error("[Auth] DB upsert failed:", err.message);
        return res.status(500).json({ error: "Database error" });
    }

    // 3. Issue a signed JWT
    const token = jwt.sign({ userID }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 4. Set the JWT in an httpOnly cookie
    res.cookie("token", token, cookieOptions());

    return res.status(200).json({ msg: "Authenticated" });
});

// authenticate
router.get("/auth", verifyAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, email, name, avatar_url, created_at
             FROM users WHERE user_id = $1`,
            [req.user.userID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];
        return res.json({
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
        });
    } catch (err) {
        console.error("[Auth] /auth query failed:", err.message);
        return res.status(500).json({ error: "Database error" });
    }
});

// logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", cookieOptions());
    return res.json({ message: "Logged out" });
});

export default router;
