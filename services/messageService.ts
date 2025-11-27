import { Request, Response } from "express";
import { Message } from "../model/Messages.js";
import mongoose from "mongoose";

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

  // Get unread message counts for a user (from all senders)
  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    try {
      const unreadCounts = await Message.aggregate([
        {
          $match: {
            receiver: new mongoose.Types.ObjectId(userId),
            status: { $ne: "read" },
          },
        },
        {
          $group: {
            _id: "$sender",
            count: { $sum: 1 },
          },
        },
      ]);

      // Convert to { senderId: count } object
      const countsMap: Record<string, number> = {};
      unreadCounts.forEach((item) => {
        countsMap[item._id.toString()] = item.count;
      });

      return countsMap;
    } catch (error) {
      console.error("Error getting unread counts:", error);
      return {};
    }
  }
}

export const messageService = new MessageService();
