# ITECify

A real-time collaborative coding workspace built for **iTEC 2026 Web Development Challenge**.

ITECify is a modern multiplayer development environment where multiple users can collaborate inside the same coding room, receive AI-powered coding assistance, and replay the full session history.

Inspired by products such as **Figma**, **VSCode Live Share**, and **AI pair programming tools**, ITECify brings real-time collaboration and intelligent development workflows into one unified platform.

---

## 🚀 Current Features

### 🔐 Authentication System
Secure user authentication powered by **Supabase Auth**.

Current capabilities:
- user sign up
- user sign in
- persistent authenticated sessions
- logout support
- protected workspace flow

---

### 🏠 Dashboard Workspace
Dedicated dashboard after authentication.

Users can:
- create a new coding room
- join an existing room using room ID
- access isolated collaborative sessions

Each room receives a **unique dynamic URL**.

Example:

```text
/editor/room-id
```

---

### 💻 Real-Time Collaborative Editor
Built using **Monaco Editor + Socket.IO**.

Features:
- real-time code sync
- multiplayer room sessions
- live connected users list
- live cursor broadcasting
- instant code updates across users

Multiple users can collaborate in the same room simultaneously.

---

### 🧠 AI Pair Programming Assistant
Integrated AI suggestion engine.

Features:
- live code suggestions
- improvement blocks
- accept / reject flow
- suggestion refresh while typing
- runtime AI assistance

The AI currently acts as an intelligent **code improvement copilot**.

---

### ⏪ Time-Travel Replay
Session history replay system.

Features:
- code snapshots while typing
- interactive replay slider
- previous state navigation
- debugging and session rewind

This implements the **Time-Travel Debugging side-quest**.

---

### 💾 Persistent Rooms
Collaborative rooms are saved using **Supabase**.

Features:
- room creation
- room retrieval
- persistent room code state
- cloud-backed session persistence

Users can re-enter rooms using the same room ID.

---

### ▶ Shared Output Panel
Dedicated output panel inside the editor.

Used for:
- code output stream
- AI suggestions
- debugging feedback
- future shared terminal integration

---

## 🧠 Tech Stack

### Frontend
- React
- Vite
- Monaco Editor
- React Router
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- OpenAI API

### Database / Auth
- Supabase
- Supabase Auth

---

## 🎯 Product Vision
ITECify aims to become a **collaborative software development environment** where:

- multiple users code together in real time
- AI assists development workflows
- rooms are persistent and shareable
- sessions can be replayed
- backend and frontend coexist in one workspace
- code execution and debugging happen inside the platform

A **Figma-like collaborative experience for developers**.

---

## 🔥 Current Demo Flow
```text
Landing
→ Authentication
→ Dashboard
→ Create / Join Room
→ Real-Time Collaborative Editor
```

---

Built for **iTEC 2026**.
