import express from "express";
import {
    createOrGetChat,
    sendMessage,
    getMessages,
    markMessageRead,
    updateLastSeen,
} from "../controllers/chatController";

const router = express.Router();

// 1. Create or Get Chat
// POST /api/chat/create
router.post("/create", createOrGetChat);

// 2. Send Message
// POST /api/chat/:chatId/message/send
router.post("/:chatId/message/send", sendMessage);

// 3. Get Messages
// GET /api/chat/:chatId/messages?limit=50
router.get("/:chatId/messages", getMessages);

// 4. Mark Message Read
// POST /api/chat/:chatId/message/:messageId/read
router.post("/:chatId/message/:messageId/read", markMessageRead);

// 5. Update Last Seen Message
// POST /api/chat/:chatId/lastseen
router.post("/:chatId/lastseen", updateLastSeen);

export default router;