import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message } from '../model/Messages.js';
import { User } from '../model/Users.js';

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
    const tokenCookie = cookie?.split('; ').find(row => row.startsWith('token=')); // Find the token by finding the cookie that starts with token=
    if (tokenCookie) {
      token = tokenCookie.split('=')[1]; // remove the token= from the cookie to get the token value
      console.log('Token found in cookie:', token ? 'Yes' : 'No');
    }

    if (!token) {
      console.log('No token found in handshake');
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
      socket.user = { _id: decoded._id, email: decoded.email };
      console.log('Socket authenticated for user:', socket.user._id);
      next();
    } catch (err) {
      console.log('Socket authentication failed:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.user?._id;
    console.log('User connected:', userId);
    if (userId) {
      // Join a room with the user's ID for private messaging
      socket.join(userId);

      // Update user's online status in the database
      const updateResult = await User.findByIdAndUpdate(userId, { online: true });
      console.log('Set user online in DB:', userId, 'Result:', updateResult ? 'Success' : 'Failed');

      // Broadcast to all clients that this user is online
      io.emit('user_online', userId);
      console.log('Broadcasted user_online:', userId);

      // Send the list of currently online users to the newly connected client
      const onlineUsers = await User.find({ online: true }).select('_id');
      const onlineUserIds = onlineUsers.map(user => user._id);
      console.log('Sending online_users list:', onlineUserIds);
      socket.emit('online_users', onlineUserIds);
    }

    socket.on('send_message', async (data) => {
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
        io.to(receiverId).emit('receive_message', newMessage);
        // Emit to sender
        io.to(senderId).emit('receive_message', newMessage);

      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', userId);
      if (userId) {
        // Update user's online status in the database
        const updateResult = await User.findByIdAndUpdate(userId, { online: false, lastSeen: new Date() });
        console.log('Set user offline in DB:', userId, 'Result:', updateResult ? 'Success' : 'Failed');

        // Broadcast to all clients that this user is offline
        io.emit('user_offline', userId);
        console.log('Broadcasted user_offline:', userId);
      }
    });
  });
};
