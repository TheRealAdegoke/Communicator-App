# Communicator App — React Frontend

A real-time messaging frontend built with **React**, **TypeScript**, and **Tailwind CSS** as a recruitment task submission.

---

## Features

- User registration and login
- View all other registered users
- Send and receive messages in real-time via **Server-Sent Events (SSE)**
- Offline support — messages are queued and sent automatically when connection is restored
- Optimistic UI — messages appear instantly before the server confirms
- Toast notifications for all key actions (login, register, send, offline, errors)

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI and type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Sonner | Toast notifications |

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- The [CommunicatorApi backend](https://github.com/TheRealAdegoke/CommunicatorAPI) running either locally or on Render

---

## Getting Started

```bash
# 1. Clone the repo
git clone <your-frontend-repo-url>
cd communicator-frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

App runs at `http://localhost:5173`

---

## Connecting to the Backend

Open `src/lib/api.ts` and set `BASE_URL` to wherever the backend is running:

```ts
// Local development
const BASE_URL = "http://localhost:5241";

// Live backend on Render
const BASE_URL = "https://communicatorapi.onrender.com";
```

---

## How to Use

1. Open the app and **register** a new account
2. **Log in** with your credentials
3. You will see all other registered users in the sidebar
4. Click any user to open a conversation and **send messages**
5. Messages are delivered to the other user **instantly** without any refresh

---

## Testing Multi-Tab Messaging

1. Open the app in **two separate browser tabs**
2. Register two users (e.g. Alice and Bob)
3. Log in as Alice in tab 1 and Bob in tab 2
4. Select each other from the user list and send messages
5. Messages appear instantly in the other tab — each tab maintains its own login session via `sessionStorage`

---

## Testing Offline Behaviour

1. Open **DevTools → Network tab** → set throttling to **Offline**
2. Try sending a message — it queues immediately with a toast notification
3. Set throttling back to **No throttling**
4. The queued message flushes and delivers automatically

---

## Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **sessionStorage for tokens** | Each browser tab gets its own isolated token, allowing two different users to be logged in simultaneously in different tabs |
| **SSE over polling** | Messages are pushed from the server the moment they are sent — no delays, no wasted requests |
| **Optimistic UI** | Messages are shown immediately in the chat before the server responds, making the app feel instant |
| **Offline queue in sessionStorage** | Queued messages are tied to the tab session and flushed automatically on reconnect |
| **Sonner for toasts** | Lightweight, composable, and works without a context provider |