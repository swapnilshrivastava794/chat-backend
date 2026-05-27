import { Request, Response } from "express";
import { Chat, ChatMember } from "../models/index";
import db from "../config/firebase";
import { Op } from "sequelize";

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /chat/create — Create or Get Chat
// ─────────────────────────────────────────────────────────────────────────────
export const createOrGetChat = async (req: Request, res: Response) => {
    try {
        const { userAId, userBId } = req.body;

        if (!userAId || !userBId) {
            return res.status(400).json({ success: false, message: "userAId and userBId are required" });
        }

        if (userAId === userBId) {
            return res.status(400).json({ success: false, message: "Users must be different" });
        }

        // Find an existing private chat that contains both users
        const memberA = await ChatMember.findAll({ where: { user_id: userAId } }) as any[];
        const chatIdsForA = memberA.map((m: any) => m.chat_id);

        if (chatIdsForA.length > 0) {
            const existingMember = await ChatMember.findOne({
                where: {
                    user_id: userBId,
                    chat_id: { [Op.in]: chatIdsForA },
                },
            }) as any;

            if (existingMember) {
                // Verify the chat is of type "private"
                const existingChat = await Chat.findOne({
                    where: { id: existingMember.chat_id, type: "private" },
                }) as any;

                if (existingChat) {
                    return res.status(200).json({
                        success: true,
                        message: "Chat already exists",
                        chatId: existingChat.id,
                    });
                }
            }
        }

        // Create new chat
        const chat = await Chat.create({ type: "private" }) as any;

        await ChatMember.create({ chat_id: chat.id, user_id: userAId });
        await ChatMember.create({ chat_id: chat.id, user_id: userBId });

        return res.status(201).json({
            success: true,
            message: "Chat created successfully",
            chatId: chat.id,
        });
    } catch (error: any) {
        console.error("Error creating/getting chat:", error);
        return res.status(500).json({ success: false, message: "Failed to create chat", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /chat/:chatId/message/send — Send Message
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { senderId, text } = req.body;

        if (!senderId || !text) {
            return res.status(400).json({ success: false, message: "senderId and text are required" });
        }

        // Verify chat exists in PostgreSQL
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        // Verify sender is a member of the chat
        const membership = await ChatMember.findOne({ where: { chat_id: chatId, user_id: senderId } });
        if (!membership) {
            return res.status(403).json({ success: false, message: "Sender is not a member of this chat" });
        }

        // Store message in Firestore
        const messageRef = await db
            .collection("chats")
            .doc(String(chatId))
            .collection("messages")
            .add({
                senderId,
                text,
                timestamp: new Date(),
                readBy: [senderId],
            });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            messageId: messageRef.id,
        });
    } catch (error: any) {
        console.error("Error sending message:", error);
        return res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /chat/:chatId/messages?limit=50 — Get Messages
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        // Verify chat exists
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        const snapshot = await db
            .collection("chats")
            .doc(String(chatId))
            .collection("messages")
            .orderBy("timestamp", "asc")
            .limit(limit)
            .get();

        const messages = snapshot.docs.map((doc) => ({
            messageId: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() ?? doc.data().timestamp,
        }));

        return res.status(200).json({
            success: true,
            chatId,
            count: messages.length,
            messages,
        });
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /chat/:chatId/message/:messageId/read — Mark Message Read
// ─────────────────────────────────────────────────────────────────────────────
export const markMessageRead = async (req: Request, res: Response) => {
    try {
        const { chatId, messageId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        const messageRef = db
            .collection("chats")
            .doc(String(chatId))
            .collection("messages")
            .doc(messageId);

        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const data = messageDoc.data() as any;
        const readBy: string[] = data.readBy || [];

        // Add userId if not already present
        if (!readBy.includes(String(userId))) {
            readBy.push(String(userId));
            await messageRef.update({ readBy });
        }

        return res.status(200).json({
            success: true,
            message: "Message marked as read",
            messageId,
            readBy,
        });
    } catch (error: any) {
        console.error("Error marking message as read:", error);
        return res.status(500).json({ success: false, message: "Failed to mark message as read", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /chat/:chatId/lastseen — Update Last Seen Message
// ─────────────────────────────────────────────────────────────────────────────
export const updateLastSeen = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { userId, messageId } = req.body;

        if (!userId || !messageId) {
            return res.status(400).json({ success: false, message: "userId and messageId are required" });
        }

        // Verify chat exists
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        // Verify message exists in Firestore
        const messageDoc = await db
            .collection("chats")
            .doc(String(chatId))
            .collection("messages")
            .doc(messageId)
            .get();

        if (!messageDoc.exists) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Upsert the lastSeen record per user per chat
        await db
            .collection("chats")
            .doc(String(chatId))
            .collection("lastSeen")
            .doc(String(userId))
            .set({
                userId: String(userId),
                messageId,
                updatedAt: new Date(),
            });

        return res.status(200).json({
            success: true,
            message: "Last seen updated",
            chatId,
            userId,
            messageId,
        });
    } catch (error: any) {
        console.error("Error updating last seen:", error);
        return res.status(500).json({ success: false, message: "Failed to update last seen", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /user/:userId/chats — List User Chats
// ─────────────────────────────────────────────────────────────────────────────
export const listUserChats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Get all chat memberships for this user
        const memberships = await ChatMember.findAll({
            where: { user_id: userId },
        }) as any[];

        if (memberships.length === 0) {
            return res.status(200).json({ success: true, chats: [] });
        }

        const chatIds = memberships.map((m: any) => m.chat_id);

        // For each chat, fetch all members
        const allMemberships = await ChatMember.findAll({
            where: { chat_id: { [Op.in]: chatIds } },
        }) as any[];

        // Group members by chatId
        const chatMap: Record<number, number[]> = {};
        for (const m of allMemberships) {
            if (!chatMap[m.chat_id]) chatMap[m.chat_id] = [];
            chatMap[m.chat_id].push(m.user_id);
        }

        // Fetch chat metadata
        const chats = await Chat.findAll({
            where: { id: { [Op.in]: chatIds } },
        }) as any[];

        const result = chats.map((chat: any) => ({
            chatId: chat.id,
            type: chat.type,
            memberIds: chatMap[chat.id] || [],
        }));

        return res.status(200).json({
            success: true,
            userId,
            count: result.length,
            chats: result,
        });
    } catch (error: any) {
        console.error("Error listing user chats:", error);
        return res.status(500).json({ success: false, message: "Failed to list user chats", error: error.message });
    }
};