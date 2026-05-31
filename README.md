# 🤖 IntellMeet – AI-Powered Enterprise Meeting Platform

> Real-Time Video Meetings • AI Summaries • Smart Action Items • Team Collaboration

Built with the MERN stack for Zidio Development – Web Development Domain (March 2026)

---

## 🚀 Live Demo
[Coming soon](#)

---

## 📸 Screenshots
*Coming soon*

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.io + WebRTC |
| AI | OpenAI (Whisper + GPT) |
| Auth | JWT + bcrypt |
| Cache | Redis |
| Storage | Cloudinary |
| DevOps | Docker + GitHub Actions |

---

## 🗂️ Project Structure
ai-meeting-platform-team6/
├── client/          # React frontend
├── server/          # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env.example
│   └── index.js
└── README.md

---

## 🛠️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/CodecrafterGeetika/ai-meeting-platform-team6.git
cd ai-meeting-platform-team6
```

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
# Fill in your values in .env
node index.js
```

### 3. Setup Client
```bash
cd client
npm install
npm run dev
```

### 4. Environment Variables
Create `server/.env` using `server/.env.example` as reference:
MONGO_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

---

## 🔒 Security
- JWT with refresh token rotation
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting on auth routes
- Helmet.js for HTTP header security
- `.env` never committed

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get profile | Yes |

---

## 🤝 Contributing

1. Clone the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: describe your change"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request → assign a reviewer

**Never push directly to main.**

---

## 📄 License
MIT



