# SarkariSahayak

**Government Scheme Eligibility & Application Navigator**

A web platform that helps Indian citizens discover government welfare schemes they are eligible for, understand the application process step-by-step, track their applications, and receive deadline reminders — all in one place.

---

## Project Structure

```
SarkariSahayak/
├── backend/          # Express.js API server
├── frontend/         # React (Vite) SPA
└── README.md
```

---

## Prerequisites

- **Node.js** v20 LTS
- **PostgreSQL** (or a [Neon](https://neon.tech) free-tier account)
- **Redis** (local install, or [Upstash](https://upstash.com) free-tier)
- **Cloudinary** account (free tier — 25GB)
- **Gmail** account with App Password enabled (for email)

---

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# → Fill in your DATABASE_URL, Redis URL, JWT secrets, etc.

# Run database migrations
npx prisma migrate dev --name init

# Seed with sample schemes
npm run seed

# Start development server
npm run dev
```

The API will be running at `http://localhost:5000`.

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The React app will be running at `http://localhost:5173`.

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for a full list of required environment variables.

---

## API Documentation

Once the server is running, visit `http://localhost:5000/api/docs` for the Swagger UI.

Health check: `GET http://localhost:5000/api/health`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| Auth | JWT + bcrypt + Google OAuth (Passport.js) |
| Email | Nodemailer + Gmail SMTP |
| File Storage | Multer + Cloudinary |
| Frontend | React 18 + Vite |
| State | Zustand |
| HTTP Client | Axios |
| Routing | React Router v6 |

---

## Phased Rollout

- **Phase 1** (current): Core — Auth, Eligibility Engine, Scheme DB, Email Queue, Document Upload
- **Phase 2**: Payments (Razorpay), Redis caching, API keys, UI polish
- **Phase 3**: Hindi support, PWA, public API, SEO

---

## Disclaimer

SarkariSahayak is not affiliated with any government body. All scheme information is sourced from public government portals. Always verify eligibility on the official portal before applying.
