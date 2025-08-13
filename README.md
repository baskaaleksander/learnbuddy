# LearnBuddy

AI‑powered study companion that generates structured summaries from your learning materials. Browse and manage summaries, navigate chapters via a table of contents, and track what you already know or mark as important.

- Frontend: Next.js app for browsing materials and summaries.
- Backend: NestJS API integrating OpenAI to generate summaries, with PostgreSQL and Redis for storage and caching.
- One‑command local setup with Docker Compose.

## Tech Stack

- Frontend
  - Next.js, React, TypeScript
  - Jest, React Testing Library
  - UI: Tailwind-based components, lucide-react icons
- Backend
  - NestJS (TypeScript)
  - Drizzle ORM
  - PostgreSQL, Redis
  - OpenAI API
- Tooling
  - Docker, Docker Compose
  - ESLint, Prettier

Key files:

- Compose: [docker-compose.yml](docker-compose.yml)
- Backend:
  - [backend/src/open-ai/open-ai.service.ts](backend/src/open-ai/open-ai.service.ts) (OpenAI summary generation)
  - [backend/src/summary/summary.service.ts](backend/src/summary/summary.service.ts) (summary CRUD, marking chapters)
  - [backend/drizzle.config.ts](backend/drizzle.config.ts)
  - [backend/README.md](backend/README.md)
- Frontend:
  - [frontend/app/dashboard/summaries/[id]/page.tsx](frontend/app/dashboard/summaries/%5Bid%5D/page.tsx) (summary page)
  - [frontend/components/features/summaries/table-of-contents.tsx](frontend/components/features/summaries/table-of-contents.tsx)
  - [frontend/components/features/summaries/summary-chapter.tsx](frontend/components/features/summaries/summary-chapter.tsx)
  - [frontend/components/features/material/material-summary.tsx](frontend/components/features/material/material-summary.tsx)
  - [frontend/README.md](frontend/README.md)
  - Tests: [frontend/**tests**/components/features/summaries/table-of-contents.test.tsx](frontend/__tests__/components/features/summaries/table-of-contents.test.tsx), [frontend/**tests**/components/features/summaries/summary-chapter.test.tsx](frontend/__tests__/components/features/summaries/summary-chapter.test.tsx), [frontend/**tests**/components/features/material/material-summary.test.tsx](frontend/__tests__/components/features/material/material-summary.test.tsx)

## Features

- Generate AI summaries from learning materials.
- View structured summaries with chapters and bullet points.
- Table of contents with quick navigation.
- Mark chapters as known or important.
- Regenerate and delete summaries.
- Basic subscription/tokens handling (usage display and limits in UI).
- Unit tests for key UI components.

## Installation & Setup

Prerequisites: Docker, Docker Compose, Node.js 18+

1. Clone the repository

```bash
git clone https://github.com/your-org/learnbuddy.git
cd learnbuddy
```

2. Configure environment variables

Create a root .env for Docker and shared settings:

```env
# Root .env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=learnbuddy
POSTGRES_PORT=5432

REDIS_PORT=6379

BACKEND_PORT=3001
FRONTEND_PORT=3000
```

Create backend/.env:

```env
# backend/.env
# Postgres connects to the docker service name "postgres"
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/learnbuddy

REDIS_HOST=redis
REDIS_PORT=6379

# Required for AI summary generation
OPENAI_API_KEY=your-openai-api-key

# Other typical server settings
NODE_ENV=development
JWT_SECRET=change-me
```

Create frontend/.env:

```env
# frontend/.env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3001/graphql
```

Note: Adjust variable names to match your deployment. The Docker Compose file consumes the root .env and the per-app envs.

3. Start with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (GraphQL at /graphql)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

The backend will run Drizzle migrations on start:

- See [backend/drizzle.config.ts](backend/drizzle.config.ts)
- Compose command: `npm run drizzle:push && npm run start`

## Running Locally without Docker (optional)

Backend:

```bash
cd backend
npm install
cp .env.example .env # create as shown above
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env # create as shown above
npm run dev
```

## Usage

UI

- Open http://localhost:3000.
- Navigate to a material, generate a summary, or open an existing one.
- Use the Table of Contents to jump between chapters.
- Click the checkbox to mark a chapter as known; click the triangle to mark as important.
  - UI components: [TableOfContents](frontend/components/features/summaries/table-of-contents.tsx), [SummaryChapter](frontend/components/features/summaries/summary-chapter.tsx).
- Regenerate and delete options are available from material/summary cards and pages:
  - [MaterialSummary](frontend/components/features/material/material-summary.tsx)
  - [Summary Page](frontend/app/dashboard/summaries/%5Bid%5D/page.tsx)

API

- GraphQL endpoint: `POST /graphql` (default http://localhost:3001/graphql)
- Example operations used by the app:
  - Create summary (mutation): `createSummary(materialId: "...")`
  - Delete summary (mutation): `deleteSummary(id: "...")`
  - Fetch by material (query): `getSummaryByMaterial(materialId: "...")`
- Summary generation pipeline:
  - OpenAI logic: [OpenAiService.generateSummary](backend/src/open-ai/open-ai.service.ts)
  - Persistence and updates (known/important): [SummaryService](backend/src/summary/summary.service.ts)

## Testing

Frontend (Jest + RTL):

```bash
cd frontend
npm install
npm test
# or with watch
npm test -- --watch
```

- Sample tests:
  - [table-of-contents.test.tsx](frontend/__tests__/components/features/summaries/table-of-contents.test.tsx)
  - [summary-chapter.test.tsx](frontend/__tests__/components/features/summaries/summary-chapter.test.tsx)
  - [material-summary.test.tsx](frontend/__tests__/components/features/material/material-summary.test.tsx)

Backend (NestJS):

```bash
cd backend
npm install
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run test:cov    # coverage
```

(Commands per [backend/README.md](backend/README.md))

## Folder Structure

- [backend/](backend/)
  - NestJS app (API, business logic, OpenAI integration)
  - [src/open-ai/open-ai.service.ts](backend/src/open-ai/open-ai.service.ts) — AI summary generation
  - [src/summary/summary.service.ts](backend/src/summary/summary.service.ts) — summaries CRUD, marking, listings
  - [drizzle.config.ts](backend/drizzle.config.ts), [drizzle/](backend/drizzle/) — ORM config and migrations
- [frontend/](frontend/)
  - Next.js app (App Router)
  - Pages: [app/dashboard/summaries/[id]/page.tsx](frontend/app/dashboard/summaries/%5Bid%5D/page.tsx)
  - Components:
    - [components/features/summaries/table-of-contents.tsx](frontend/components/features/summaries/table-of-contents.tsx)
    - [components/features/summaries/summary-chapter.tsx](frontend/components/features/summaries/summary-chapter.tsx)
    - [components/features/material/material-summary.tsx](frontend/components/features/material/material-summary.tsx)
  - Tests: [**tests**/](frontend/__tests__/)
- Infra
  - [docker-compose.yml](docker-compose.yml) — services: Postgres, Redis, Backend, Frontend

## Contributing

- Fork the repo and create a feature branch.
- Write tests for UI or services touching your changes.
- Run lint and tests locally.
- Open a PR with a clear description.

```bash
# Frontend
cd frontend
npm run lint
npm test

# Backend
cd backend
npm run lint
npm run test
```

## License

MIT License. You can add a LICENSE file at the repository root to formalize it.

---

Questions or issues? Open an issue or start a discussion
