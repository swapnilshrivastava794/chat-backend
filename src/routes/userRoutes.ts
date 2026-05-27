import express from "express";
import { listUserChats } from "../controllers/chatController";

const router = express.Router();

// 6. List User Chats
// GET /api/user/:userId/chats
router.get("/:userId/chats", listUserChats);

export default router;
