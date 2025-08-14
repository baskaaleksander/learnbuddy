# 🎓 LearnBuddy — AI-Powered Study Companion

**LearnBuddy** helps students and self-learners turn their notes into interactive study materials in seconds.  
Generate **summaries**, **quizzes**, and **flashcards** from any uploaded content — all powered by AI.

💡 Designed for quick setup, easy local development, and scalable production deployment.

https://learbuddy.baskaaleksander.com - Live demo

---

## 📺 Video Showcase

[![Watch the video](https://img.youtube.com/vi/ehJEvfvgtxw/0.jpg)](https://youtu.be/ehJEvfvgtxw)

---

## 🚀 Quick Start (Docker)

```bash
git clone https://github.com/your-org/learnbuddy.git
cd learnbuddy
docker compose up --build
```

- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:3001 (GraphQL at `/graphql`)
- **PostgreSQL** → localhost:5432
- **Redis** → localhost:6379

Backend automatically runs Drizzle migrations on start.

---

## 🧩 Tech Stack

**Frontend**

- Next.js (React + TypeScript)
- Tailwind CSS + shadcn/ui + lucide-react icons
- Jest + React Testing Library + Cypress (in progress)

**Backend**

- NestJS (TypeScript)
- Drizzle ORM
- PostgreSQL
- Redis for caching
- BullMQ for tasks queues
- AWS S3 for storage
- OpenAI API for AI content generation
- Stripe API for subscription & usage tracking
- Jest and Supertest for testing

**Tooling**

- Docker & Docker Compose
- ESLint + Prettier

---

## ✨ Features

### AI-Generated Learning Materials

- 📄 Summaries of uploaded notes
- 📝 Quizzes to test knowledge
- 🎴 Flashcards for active recall

### Learning Experience

- 📚 Table of Contents with quick navigation
- ✅ Mark chapters as **known**
- 📌 Mark chapters as **important**
- ♻ Regenerate or delete materials on demand
- 📊 Get stats of your knowledge
- 🔄 Come back to quizzes whenever you want
- 📤 Export your summaries or flashcards in suitable format

### Subscription & Usage

- 💳 Subscription & token handling
- 📊 Usage display & limits in UI

### Developer-Friendly

- 🐳 One-command Docker setup
- 🧪 Unit tests for key UI components
- ⚡ Caching with Redis

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/learnbuddy.git
cd learnbuddy
```

### 2. Environment Variables

**Root `.env`**

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learnbuddy
POSTGRES_PORT=5432

REDIS_PORT=6379

BACKEND_PORT=3001
FRONTEND_PORT=3000
```

**Backend `.env`**

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learnbuddy
REDIS_HOST=redis
REDIS_PORT=6379
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=development
JWT_SECRET=change-me
```

**Frontend `.env`**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3001/graphql
```

---

### 3. Start with Docker

```bash
docker compose up --build
```

---

## 🖥️ Running Locally (Without Docker)

**Backend**

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🎯 Usage

**UI**

- Visit http://localhost:3000
- Upload or open a material
- Generate summaries, quizzes, or flashcards
- Use Table of Contents to navigate
- Mark chapters as known/important

**API**

- GraphQL: `POST /graphql` (default http://localhost:3001/graphql)
- Example operations:
  - `createSummary(materialId: "...")`
  - `deleteSummary(id: "...")`
  - `getSummaryByMaterial(materialId: "...")`

Summary generation logic:

- AI → [`OpenAiService.generateSummary`](backend/src/open-ai/open-ai.service.ts)
- Persistence → [`SummaryService`](backend/src/summary/summary.service.ts)

---

## 🧪 Testing

**Frontend**

```bash
cd frontend
npm test
npm test -- --watch
```

**Backend**

```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage
```

---

## 🤝 Contributing

1. Fork & create a feature branch
2. Add tests for your changes
3. Run lint & tests before PR

```bash
# Frontend
npm run lint && npm test

# Backend
npm run lint && npm run test
```

---

## 📜 License

MIT — see the LICENSE file for details.
