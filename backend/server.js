import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import { verifyAuth, verifyToken } from "./middleware/jwt.js";
import chatRouter from "./routes/chat.js";
import matchRouter from "./routes/match.js";
import userRouter from "./routes/user.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

if (!process.env.PORT) {
    throw new Error("Missing PORT environment variable.");
}

const app = express();

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/chat", verifyAuth, chatRouter);
app.use("/match", verifyAuth, matchRouter);
app.use("/user", verifyToken, userRouter);

app.listen(process.env.PORT, () => {
    console.log("Server started on port " + process.env.PORT);
});
