import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { connectDB } from './config/DB_Connection.js';
import { initializeSocketIO } from './sockets/socketHandler.js';
// routes
import { userRouter } from './routes/userRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// import middleware 
import { authMiddleware } from './middleware/authMiddleware.js';
// Load environment variables
dotenv.config();
// Initialize database connection after env vars are loaded
await connectDB();

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'https://world-chat-apps.vercel.app'], credentials: true }));
// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://world-chat-apps.vercel.app'],
  },
});
// Initialize Socket.IO with authentication and event handlers
initializeSocketIO(io);

app.get('/', (_req, res) => {
  res.send('Hello, World!');
});

//auth routes 
app.use('/api/auth', authRouter);
// user routes
app.use('/api/users', authMiddleware.verifyToken, userRouter);
// message routes
app.use('/api/messages', messageRoutes);


const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});