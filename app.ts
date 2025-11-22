import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { connectDB } from './config/DB_Connection.js';
// routes
import { userRouter } from './routes/userRoutes.js';
import { authRouter } from './routes/authRoutes.js';

// import middleware 
import { authMiddleware } from './middleware/authMiddleware.js';
// Load environment variables
dotenv.config();
// Initialize database connection after env vars are loaded
await connectDB();

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }));
// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);

const io = new Server(httpServer, { cors: { origin: ['http://localhost:3000'] } });

io.on('connection', (socket) => {
  console.log('a user connected');      
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.get('/', (_req, res) => {
  res.send('Hello, World!');
});
//auth routes 
app.use('/api/auth', authRouter);
// user routes
app.use('/api/users', authMiddleware.verifyToken, userRouter);


const PORT = process.env.PORT || 4000;  

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});