# Backend Documentation

## Overview

This is the backend for the Chat Application, built with Node.js, Express, and MongoDB. It handles user authentication, real-time messaging via Socket.IO, and data persistence.

## Tech Stack & Libraries

- **Core**: Node.js, Express
- **Database**: MongoDB, Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JSON Web Token (JWT), Bcrypt
- **Email**: Node Mailjet
- **Utilities**: Dotenv, Cors
- **Dev Tools**: TypeScript, Nodemon, Prettier

## Architecture

The project follows a standard MVC-like structure:

- **Controller/**: Handles incoming HTTP requests and responses.
- **routes/**: Defines API endpoints and maps them to controllers.
- **model/**: Mongoose schemas for MongoDB interaction.
- **sockets/**: Contains Socket.IO event handlers and logic.
- **middleware/**: Custom middleware (e.g., authentication).
- **config/**: Configuration files (e.g., database connection).
- **services/**: Business logic and external services (e.g., email).
- **utils/**: Utility functions.

## Setup & Installation

1.  **Prerequisites**: Node.js and MongoDB installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**: Create a `.env` file in the root directory with the following variables:
    ```env
    PORT=4000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    # Email Service Credentials (Mailjet/Nodemailer)
    MAILJET_API_KEY=...
    MAILJET_API_SECRET=...
    # Client URL for CORS
    CLIENT_URL=http://localhost:3000
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Build & Start Production**:
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint           | Description            | Body Parameters                 |
| :----- | :----------------- | :--------------------- | :------------------------------ |
| `POST` | `/signup`          | Register a new user    | `username`, `email`, `password` |
| `GET`  | `/verify-email`    | Verify email address   | `token` (query param)           |
| `POST` | `/login`           | Authenticate user      | `email`, `password`             |
| `POST` | `/forgot-password` | Request password reset | `email`                         |
| `POST` | `/reset-password`  | Reset password         | `token`, `newPassword`          |

### Users (`/api/users`)

_Requires Authentication Header: `Authorization: Bearer <token>`_

| Method | Endpoint   | Description              |
| :----- | :--------- | :----------------------- |
| `GET`  | `/profile` | Get current user profile |
| `GET`  | `/`        | Get all users            |

### Messages (`/api/messages`)

_Requires Authentication Header: `Authorization: Bearer <token>`_

| Method | Endpoint | Description                              |
| :----- | :------- | :--------------------------------------- |
| `GET`  | `/:id`   | Get conversation with a specific user ID |

## Socket.IO Events

The backend listens for and emits the following events. Authentication is handled via a handshake token.

### Client -> Server

| Event                 | Payload                | Description                          |
| :-------------------- | :--------------------- | :----------------------------------- |
| `send_message`        | `{ receiverId, text }` | Send a new message.                  |
| `user_typing`         | `{ receiverId }`       | Notify that user is typing.          |
| `user_stopped_typing` | `{ receiverId }`       | Notify that user stopped typing.     |
| `mark_as_read`        | `{ senderId }`         | Mark messages from a sender as read. |
| `disconnect`          | N/A                    | Handle user disconnection.           |

### Server -> Client

| Event                  | Payload                          | Description                                               |
| :--------------------- | :------------------------------- | :-------------------------------------------------------- |
| `user_online`          | `userId`                         | Broadcast when a user comes online.                       |
| `online_users`         | `[userIds]`                      | Sent to a newly connected user with list of online users. |
| `receive_message`      | `Message` object                 | Received by both sender and receiver.                     |
| `user_typing`          | `{ userId }`                     | Notification that a user is typing.                       |
| `user_stopped_typing`  | `{ userId }`                     | Notification that a user stopped typing.                  |
| `messages_read_update` | `{ receiverId, status: 'read' }` | Notify sender that their messages were read.              |
| `user_offline`         | `userId`                         | Broadcast when a user goes offline.                       |

## Database Schema

### User

- `username`: String, unique
- `email`: String, unique
- `password`: String (hashed)
- `isVerified`: Boolean
- `online`: Boolean
- `verificationToken`: String
- `verificationTokenExpires`: Date
- `resetPasswordToken`: String
- `resetPasswordExpires`: Date

### Message

- `sender`: ObjectId (User)
- `receiver`: ObjectId (User)
- `text`: String
- `status`: Enum ('sent', 'delivered', 'read')
- `timestamps`: CreatedAt, UpdatedAt
