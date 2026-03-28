# ITECify

A collaborative code workspace built for **iTEC 2026 Web Development Challenge**.

ITECify is a real-time code collaboration and sandboxing platform inspired by modern multi-user creative tools such as collaborative editors and AI-assisted IDEs.

The platform enables multiple users to code together in the same workspace, see each other’s presence in real time, receive AI-powered code suggestions, and replay the coding session through a time-travel timeline.

---

## 🚀 Current Features

### 1. Real-Time Collaboration

* live collaborative code editor using **WebSockets**
* instant code sync between multiple tabs / users
* shared workspace session
* live connected users list
* real-time cursor broadcasting

Built with:

* **React**
* **Monaco Editor**
* **Socket.IO**
* **Express**

---

### 2. AI Pair Programming Assistant

Integrated AI suggestion engine powered by **OpenAI API**.

Current capabilities:

* live code suggestions
* AI block suggestions
* accept / reject suggestion flow
* suggestion refresh after typing
* run-time AI improvement requests

The AI currently acts as a **code improvement block assistant**.

---

### 3. Time-Travel Replay

Replay timeline for the collaborative session.

Features:

* version snapshots while typing
* interactive replay slider
* move back to previous code states
* session debugging / rewind experience

This implements the **Time-Travel Debugging side-quest** from the challenge.

---

### 4. Shared Output Panel

Dedicated right-side output panel.

Used for:

* session output stream
* AI suggestions
* future shared terminal support

---

### 5. Minimal UI System

Consistent dark minimalist interface.

Visual principles:

* black / white palette
* monospaced typography
* minimal distraction
* premium collaborative IDE feel

---

## 🧠 Tech Stack

### Frontend

* React
* Vite
* Monaco Editor
* Socket.IO Client

### Backend

* Node.js
* Express
* Socket.IO
* OpenAI API

### Database (in progress)

* Supabase

---

## 🛠️ In Progress

Currently building:

* persistent rooms
* room creation / join system
* database-backed sessions
* authentication
* saved user workspaces

---

## 🎯 Next Milestones

* room creation and join flow
* persistent code rooms with Supabase
* user accounts
* shared room history
* collaborative terminal
* containerized code execution
* Docker sandboxing

---

## 💥 Vision

ITECify aims to become a collaborative development environment where:

* multiple humans can code together
* AI agents assist in real time
* sessions can be replayed
* backend and frontend coexist in one workspace
* deployment and execution happen inside the platform

A Figma-like collaborative experience for software development.

---

Built for **iTEC 2026**
