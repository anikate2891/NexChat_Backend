import { generateResponse, generateChatTitle } from "../services/ai.services.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

export async function sendMessage(req, res) {
    const { message, chat: chatid } = req.body;

    let chat;
    let title;

    if (!chatid) {
        title = await generateChatTitle(message);
        chat = await chatModel.create({
            user: req.user.id,
            title,
        });
    }

    const chatIdToUse = chatid || chat._id;

    await messageModel.create({
        chat: chatIdToUse,
        content: message,
        role: 'user'
    });

    const messages = await messageModel
        .find({ chat: chatIdToUse })
        .sort({ createdAt: 1 });

    const result = await generateResponse(messages);

    const aiMessage = await messageModel.create({
        chat: chatIdToUse,
        content: result,
        role: 'ai'
    });

    res.status(200).json({
        title,
        chat,
        aiMessage
    });
}

export async function getChats(req, res) {
    const chats = await chatModel.find({ user: req.user.id })
    res.status(200).json({
        message: "Chats fetched successfully",
        chats
    });
}

export async function getMessages(req, res) {
    const { chatid } = req.params;

    const chat = await chatModel.findOne({ _id: chatid, user: req.user.id });
    if(!chat) {
        return res.status(404).json({   message: "Chat not found" });
    }   

    const messages = await messageModel
        .find({ chat: chatid })
        .sort({ createdAt: 1 })
    res.status(200).json({
        message: "Messages fetched successfully",
        messages
    });
}

export async function deleteChat(req, res) {
    const { chatid } = req.params;

    const chat = await chatModel.findOne({ _id: chatid, user: req.user.id });

    if(!chat) {
        return res.status(404).json({   message: "Chat not found" });
    }

    await chatModel.deleteOne({ _id: chatid });
    await messageModel.deleteMany({ chat: chatid });
    res.status(200).json({ message: "Chat deleted successfully" });
}

