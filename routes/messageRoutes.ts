import express from "express";
import { messageController } from "../Controller/messageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authMiddleware.verifyToken, (req, res) =>
  messageController.getMessages(req, res)
);

export default router;
