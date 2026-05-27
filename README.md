# Chat App Backend

This is the backend service for the chat application, built using Node.js, Express, TypeScript, PostgreSQL (via Sequelize ORM), and Firebase Firestore.

## How it works
- **PostgreSQL (Sequelize)**: Used for storing relational data like users, chat channels, and membership associations.
- **Firestore (Firebase Admin SDK)**: Used to store and query chat messages to support real-time messaging capabilities.

---

## Directory Layout

- `src/config/` - Database and Firebase connections.
- `src/controllers/` - Route handlers and business logic.
- `src/models/` - Sequelize database models (`User`, `Chat`, `ChatMember`).
- `src/routes/` - Express route paths.
- `src/app.ts` - Main express app configuration and middleware.
- `src/server.ts` - Entry point that starts the server.

---

## Setup & Running

### Prerequisites
- Node.js (v18 or higher)
- A running PostgreSQL database

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root folder and add your database settings:
   ```env
   PORT=7200
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=chat_app
   DB_USER=apple
   DB_PASSWORD=
   ```

3. Setup Firebase credentials:
   - Download your project's service account private key JSON from the Firebase console.
   - Save it in the root folder of this project with the name `firebase-service-account.json`.

### How to Run

- **For Development (Hot reload)**:
  ```bash
  npm run dev
  ```
- **For Production Build**:
  ```bash
  npm run build
  npm start
  ```

---

## API Endpoints

### Chat Operations (`/api/chat`)

#### 1. Create or Get Chat
Finds an existing chat between users or creates a new one.
- **POST** `/create`
- **Body**:
  ```json
  {
    "type": "direct",
    "memberIds": ["user_id_1", "user_id_2"],
    "name": "Optional Group Name"
  }
  ```

#### 2. Send Message
Saves a message to Firestore under the specified chat ID.
- **POST** `/:chatId/message/send`
- **Body**:
  ```json
  {
    "senderId": "user_id",
    "content": "Hello world!"
  }
  ```

#### 3. Get Messages
Fetches chat messages from Firestore.
- **GET** `/:chatId/messages`
- **Query Params**: `limit` (optional, defaults to 50)

#### 4. Mark Message as Read
Marks a message as read by adding the user to the read list in Firestore.
- **POST** `/:chatId/message/:messageId/read`
- **Body**:
  ```json
  {
    "userId": "user_id"
  }
  ```

#### 5. Update Last Seen
Updates a user's last read message reference in a chat.
- **POST** `/:chatId/lastseen`
- **Body**:
  ```json
  {
    "userId": "user_id",
    "messageId": "message_id"
  }
  ```

---

### User Operations (`/api/user`)

#### 1. Get User Chats
Lists all active chats a user belongs to.
- **GET** `/:userId/chats`
