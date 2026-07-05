import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// only decode Client Token
export function verifyToken(req, res, next) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            req.user = null;
            return next();
        }

        // if not configured
        if (!JWT_SECRET) {
            res.clearCookie("token", { path: "/" });
            req.user = null;
            return next();
        }

        const payload = jwt.verify(token, JWT_SECRET);

        // if data doesnt exist
        if (!payload.userID) {
            res.clearCookie("token");
            req.user = null;
            return next();
        }

        // control what is passed to the next middleware
        req.user = {
            userID: payload.userID,
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            res.clearCookie("token");
            req.user = null;
            return next();
        }

        console.error("Invalid JWT:", err.message);
        res.clearCookie("token");
        req.user = null;
        next();
    }
}

// filter out non-authorized requests
export function verifyAuth(req, res, next) {
    verifyToken(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ msg: "Unauthorized" });
        }
        next();
    });
}
