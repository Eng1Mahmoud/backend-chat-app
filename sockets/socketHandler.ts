import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "../model/Messages.js";
import { User } from "../model/Users.js";
import { verifyToken } from "../utils/authUtils.js";
import { messageService } from "../services/messageService.js";

interface AuthSocket extends Socket {
  user?: {
    _id: string;
    email: string;
  };
}

export const initializeSocketIO = (io: Server) => {
  // Middleware for authentication
  io.use((socket: AuthSocket, next) => {
    let token;
    const cookie = socket.handshake.headers.cookie as string; // Get the cookie from the request this cookie sended by browser
    const tokenCookie = cookie?.split("; ").find((row) => row.startsWith("token=")); // Find the token by finding the cookie that starts with token=
    if (tokenCookie) {
      token = tokenCookie.split("=")[1]; // remove the token= from the cookie to get the token value
    }

    // Also check auth object for token (for cross-domain support)
    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error("Authentication error"));
    }
    try {
      const decoded = verifyToken(token) as jwt.JwtPayload;
      socket.user = { _id: decoded._id, email: decoded.email };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.user?._id;
    if (userId) {
      // Join a room with the user's ID for private messaging
      socket.join(userId);

      // Update user's online status in the database
      const updateResult = await User.findByIdAndUpdate(userId, { online: true });

      // Broadcast to all clients that this user is online
      io.emit("user_online", userId);

      // Send the list of currently online users to the newly connected client
      const onlineUsers = await User.find({ online: true }).select("_id");
      const onlineUserIds = onlineUsers.map((user) => user._id);

      socket.emit("online_users", onlineUserIds);

      // Send initial unread message counts
      const unreadCounts = await messageService.getUnreadCounts(userId);
      socket.emit("unread_counts", unreadCounts);
    }

    socket.on("send_message", async (data) => {
      const { receiverId, text } = data;
      const senderId = socket.user?._id;
      if (!senderId || !receiverId || !text) return;

      try {
        const newMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          text,
        });
        await newMessage.save();

        // Emit to receiver
        io.to(receiverId).emit("receive_message", newMessage);
        // Emit to sender
        io.to(senderId).emit("receive_message", newMessage);

        // Calculate and emit updated unread count to receiver
        const unreadCount = await Message.countDocuments({
          sender: senderId,
          receiver: receiverId,
          status: { $ne: "read" },
        });
        io.to(receiverId).emit("unread_count_update", {
          senderId,
          count: unreadCount,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Handle typing indicator
    socket.on("user_typing", (data) => {
      const { receiverId } = data;
      const senderId = socket.user?._id;
      if (!senderId || !receiverId) return;

      // Emit to receiver that sender is typing
      io.to(receiverId).emit("user_typing", { userId: senderId });
    });

    // Handle stopped typing indicator
    socket.on("user_stopped_typing", (data) => {
      const { receiverId } = data;
      const senderId = socket.user?._id;
      if (!senderId || !receiverId) return;

      // Emit to receiver that sender stopped typing
      io.to(receiverId).emit("user_stopped_typing", { userId: senderId });
    });

    // Handle mark as read
    socket.on("mark_as_read", async (data) => {
      const { senderId } = data; // The user whose messages are being read
      const receiverId = socket.user?._id; // The user reading the messages

      if (!senderId || !receiverId) return;

      try {
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );

        // Notify the sender that their messages have been read
        io.to(senderId).emit("messages_read_update", { receiverId, status: "read" });

        // Clear unread count for receiver
        io.to(receiverId).emit("unread_count_update", {
          senderId,
          count: 0,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", async () => {
      if (userId) {
        // check if user closed all tabs that he open until emit user_offline event
        const room = io.sockets.adapter.rooms.get(userId);
        if (!room || room?.size === 0) {
          io.emit("user_offline", userId);
          // Update user's online status in the database
          const updateResult = await User.findByIdAndUpdate(userId, { online: false });
        }
      }
    });
  });
};
