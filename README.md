# SportSee — Fitness Dashboard & AI Features

SportSee is a web application that helps users track fitness activities, visualize performance, chat with an AI coach, and generate training plans with calendar export.

---

## Tech Stack
- Next.js (App Router) + TypeScript
- CSS Modules
- Recharts
- Mistral (server-side calls via Next API routes)

---

## Requirements
- Node.js **18+** (recommended: Node 20)
- Yarn

---

## Setup

### 1) Clone
```bash
git clone https://github.com/ibisa08/sportsee-front/
cd sportsee-front
```

### 2) Install dependencies
```bash
yarn
```

### 3) Environment variables
Create a `.env.local` file at the root:

```env
# Required (AI)
MISTRAL_API_KEY=YOUR_MISTRAL_API_KEY

# Optional (Sports data API)
SPORTSEE_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> `.env.local` is not committed.

---

## Run

### Development
```bash
yarn dev
```
Open: http://localhost:3000

### Production
```bash
yarn build
yarn start
```

---

## Server (Next.js API Routes)
Server endpoints live in `src/app/api/`.

### Authentication
- `POST /api/auth/login` — login (stores a `sportsee_token` cookie)
- `POST /api/auth/logout` — logout

### AI Coach
- `POST /api/chat` — sends a message to Mistral and returns the assistant response

### Training Plan (AI)
- `POST /api/training-plan` — generates a **JSON** training plan (6 weeks)
- `POST /api/training-plan/ics` — exports a plan to **.ics** (one event per session + 30-min reminders)

### Sports data proxy (optional)
- `GET /api/sportsee/user-info?userId=...`
- `GET /api/sportsee/user-activity?userId=...&startWeek=...&endWeek=...`

---

## Training Plan JSON
A plan returned by `/api/training-plan` contains:
- `meta` (objective, startDate, timeZone, sessionsPerWeek, level, generatedAt)
- `weeks` (6 weeks)
- `sessions` (per week)

Each session includes:
- total duration (`durationMinutes`) or distance (`targetDistanceKm`)
- recommended intensity (`intensity`)
- session goal (`sessionGoal`)
- structured description (`details.warmup`, `details.main`, `details.cooldown`)
- optional tips (`tips[]`)

---

## Calendar export (.ics)
The exported `.ics` file includes:
- one event per training session
- `SUMMARY` like `Training - <Session Type>`
- `DTSTART/DTEND` + a full `DESCRIPTION`
- a built-in reminder **30 minutes before** (`TRIGGER:-PT30M`)
- compatibility with Apple Calendar, Google Calendar and Outlook

---

## Project structure
- `src/` — application code (pages, components, hooks)
- `src/app/api/` — server routes (AI, plan generation, ICS, auth)
- `public/` — static assets
- `docs/` — internal documentation (JSON contract, prompts, test notes)

---
