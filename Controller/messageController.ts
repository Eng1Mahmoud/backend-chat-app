import { Request, Response } from "express";
import { messageService } from "../services/messageService.js";

class MessageController {
  async getMessages(req: Request, res: Response) {
    return messageService.getMessages(req, res);
  }
}

export const messageController = new MessageController();
