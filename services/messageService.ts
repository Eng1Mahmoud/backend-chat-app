import { Request, Response } from "express";
import { Message } from "../model/Messages.js";

class MessageService {
  async getMessages(req: Request, res: Response) {
    try {
      const { id: userToChatId } = req.params;
      const senderId = req.user?._id;

      if (!senderId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const messages = await Message.find({
        $or: [
          { sender: senderId, receiver: userToChatId },
          { sender: userToChatId, receiver: senderId },
        ],
      }).sort({ createdAt: 1 }); // Sort by oldest first

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const messageService = new MessageService();
