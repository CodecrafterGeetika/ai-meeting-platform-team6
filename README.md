# 🤖 IntellMeet – AI-Powered Enterprise Meeting Platform

> Real-Time Video Meetings • AI Summaries • Smart Action Items • Team Collaboration

Built with the MERN stack for Zidio Development – Web Development Domain.

---

## 🚀 Live Demo & Deployment
- **Frontend (Client)**: Deployed on **Vercel**
- **Backend (Server)**: Deployed on **Render** (Containerized)
- **Keep-Awake Mechanism**: Includes a self-pinging background loop (enabled via `RENDER_EXTERNAL_URL` or `SELF_PING_URL` env vars) and exposed `/ping` endpoints for external monitors like UptimeRobot to prevent Render containers from sleeping.

---

## 💎 Progressive Complexity Levels (LogicVeda Submission)

IntellMeet is engineered to demonstrate three distinct phases of architectural complexity:

### 1. Modern Frontend & Real-Time Foundations (Level 1)
- **Vibrant UI**: SPA built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**, featuring dark modes, fluid micro-animations, and responsive grids designed for both mobile and desktop profiles.
- **WebRTC Video Mesh**: Real-time peer-to-peer audio and video transmission with active device toggles and screen-sharing interfaces.
- **Socket.io Signaling Gateway**: Bidirectional real-time signaling, room chat, active participant lists, and user typing notifications.

### 2. Decoupled Systems & Containerized Resilience (Level 2)
- **Decoupled Architecture**: Separate frontend client (deployed to Vercel CDN) and Express API (deployed to Render container cluster).
- **Multi-Stage Docker builds**: Optimized `Dockerfile` definitions for both the [Client](file:///c:/Users/HP/Desktop/zidio/ai-meeting-platform-team6/client/Dockerfile) and [Server](file:///c:/Users/HP/Desktop/zidio/ai-meeting-platform-team6/server/Dockerfile) to isolate dev dependencies, run as secure non-root users (`node`), and reduce production release sizes.
- **Render Blueprints**: Automated multi-container Blueprint configuration [render.yaml](file:///c:/Users/HP/Desktop/zidio/ai-meeting-platform-team6/render.yaml) for infrastructure-as-code deployments.

### 3. AI/ML-Integrated Workspace (Level 3)
- **Audio Voice Transcription**: Media recordings (`.webm` blobs) are captured and uploaded directly to the backend, which processes them using **Groq Whisper Large V3** to yield accurate speech-to-text transcripts.
- **AI Recap Generation**: Connects to **Llama3-8b-8192** via the Groq cloud endpoint to dynamically summarize transcripts (under 150 words) and extract actionable tasks.
- **Kanban Workspace Board**: An interactive, dynamic board to map extracted AI action items into Mongoose-persisted Kanban cards with assignee settings and status controls.
- **Live Notifications**: Immediate browser alerts pushed via Socket.io when AI analysis completes or when tasks are assigned to teams.

---

## ⚙️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Component architecture, static type safety, & client bundling |
| **Backend** | Node.js + Express | RESTful API backend routing |
| **Database** | MongoDB + Mongoose | Schema definitions and document persistence |
| **Real-Time** | Socket.io + WebRTC | Signaling, peer communication, and notifications |
| **AI Integration** | Groq SDK (Whisper & Llama3) | Speech-to-text and NLP summary extraction |
| **Auth** | Passport JWT + bcrypt | Bearer token authorization and hashing |
| **DevOps** | Docker + Render + Vercel | Multi-stage packaging and hosting |

---

## 🗂️ Project Structure
```text
ai-meeting-platform-team6/
├── client/              # React frontend (Vercel)
│   ├── src/
│   │   ├── components/  # Layout, Navbar, Alerts
│   │   ├── pages/       # Workspace, Meetings, Room, Login, Register
│   │   └── services/    # api Axios interceptor configuration
│   ├── vercel.json      # Vercel SPA rewrites
│   └── Dockerfile       # Multi-stage Client image
├── server/              # Express backend (Render)
│   ├── src/
│   │   ├── controllers/ # meeting, task, notification handlers
│   │   ├── models/      # schemas for User, Meeting, Task, Notification
│   │   ├── routes/      # routing registers
│   │   └── services/    # ai.service, socket.service, meeting.service
│   ├── .env.example     # Environment variable documentation
│   └── Dockerfile       # Secure multi-stage Server image
├── render.yaml          # Render Blueprint IaC
└── README.md
```

---

## 🔌 API Endpoints

### 🔑 Authentication
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account | No |
| `POST` | `/api/auth/login` | Log in and return tokens | No |
| `POST` | `/api/auth/refresh` | Request new access token using refresh token | No |

### 📹 Meetings & AI Recaps
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meetings` | Get user meetings lists | Yes |
| `POST` | `/api/meetings` | Schedule or initialize a meeting | Yes |
| `POST` | `/api/meetings/:meetingId/transcribe` | Upload audio recording for AI Whisper transcription | Yes |

### 🩺 Keep-Awake & Health Checks
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/ping` | Lightweight ping check to keep Render container active | No |
| `GET` | `/api/ping` | Alternative ping check endpoint | No |

### 📋 Workspace Tasks
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Fetch Kanban workspace board tasks | Yes |
| `POST` | `/api/tasks` | Create task card | Yes |
| `PUT` | `/api/tasks/:taskId` | Edit task assignee or column status | Yes |
| `DELETE` | `/api/tasks/:taskId` | Delete task from board | Yes |

### 🔔 Notifications
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications list | Yes |
| `PUT` | `/api/notifications/mark-read` | Mark all notifications as read | Yes |
| `DELETE` | `/api/notifications/:id` | Dismiss a specific notification | Yes |

---

## 🛠️ Local Setup

### 1. Clone & Pre-requisites
- Requires Node.js v18+ and a MongoDB connection (local or Atlas cluster).
```bash
git clone https://github.com/CodecrafterGeetika/ai-meeting-platform-team6.git
cd ai-meeting-platform-team6
```

### 2. Configure Backend Service
```bash
cd server
npm install   # (Or: yarn install)
cp .env.example .env
# Fill required credentials in .env
npm run dev
```

### 3. Configure Frontend Client
```bash
cd ../client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security Summary
- **JWT Session Security**: Short-lived access tokens (30 minutes) + rotation checks.
- **Input Sanitization**: `xss-clean` and `express-mongo-sanitize` prevent HTML insertions and NoSQL injections.
- **Brute-Force Shield**: Authentication rate-limiting restricts clients to 20 failed requests per 15 minutes.
- **Privacy Compliance**: WebRTC media feeds remain encrypted peer-to-peer (DTLS-SRTP) and are never read by server nodes.
- **Secret Isolation**: Private configurations remain strictly out of Git using `.gitignore` mappings.

---

## 🎯 Evaluator Demo Account
To quickly test all core features without registering a new email or completing email OTP verification:
1. Open the login page.
2. Click **Sign In with Demo Account**.
3. The platform will automatically log you in by dynamically initializing a unique demo account (e.g. `demo_xxxx@example.com` / `Password123!`) on your first visit, completely bypassing manual sign-up forms and email OTP steps.
