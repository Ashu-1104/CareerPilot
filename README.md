# CareerPilot

A full-stack job portal built for job hunting in India. Employers post jobs and hire; job seekers see live roles from Indian company career pages next to posted jobs, get a resume match on every job, and track their whole search in one place.

## Features

### For job seekers
- **Live jobs from company sites**: a daily import of software, data and design roles open to candidates in India, from Remotive, Remote OK, Himalayas and the Greenhouse/Lever career pages of Indian companies (Paytm, InMobi, Meesho, CRED, Zeta and more). Each job says where it came from and links to the company's application page.
- **Resume match**: upload a PDF resume once; CareerPilot reads its skills and shows, on every job, how many of the job's skills you have and which are missing. Jobs can be sorted best match first.
- **AI cover letters**: a short "how you fit" note and a cover letter written from your resume skills, through a free AI service (no key needed).
- **Application tracker**: a drag-and-drop board (Saved, Applied, Interview, Offer, Rejected) for every job, including ones from other sites, with notes, follow-up dates and stats.
- **Daily job alerts**: one notification each morning when new jobs match your resume well.
- Search with filters (source, type, category, salary), saved jobs, chat with employers and interview booking.

### For employers
- Post, edit, close and delete jobs; review applicants and their resumes; move them through In Review, Accepted and Rejected.
- **Interview scheduling**: offer up to five time slots; the candidate picks one.
- **Chat** with candidates about their application, with read receipts.
- **Live notifications** for new applications and messages, and a hiring dashboard.

### Under the hood
- Live updates over **Server-Sent Events**, opened with a short-lived ticket instead of the login token.
- Resumes are **private**: stored in MongoDB and served only to their owner and the employers they applied to.
- Role-based access on every endpoint, uploads only for logged-in users (4 MB at most).
- Runs as one **Vercel** project with two services: the React app and the Express API (a serverless function), with Vercel Cron for the daily import.

## Tech stack

React 19, Vite, Tailwind CSS 4, Framer Motion, dnd-kit, Node.js, Express 5, MongoDB (Mongoose), JWT authentication, pdf-parse, Server-Sent Events, Vercel (Functions and Cron).

## Getting started

> Node.js 20 or newer and MongoDB are required.

1. Backend: create `backend/.env`:
   ```env
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/careerpilot
   JWT_SECRET=a-long-random-string
   CRON_SECRET=another-long-random-string
   ```
   then run `npm install` and `npm run dev` in `backend/`. Load live jobs with `npm run import-jobs`.
2. Frontend: run `npm install` and `npm run dev` in `frontend/` (it calls the API on http://localhost:8000; set `VITE_API_URL` to change that).

### Optional settings
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`: use any OpenAI-compatible service (for example Groq) instead of the free default.

## Deploying to Vercel

`vercel.json` deploys the frontend and the API (`backend/vercel.js`) as two services of one project, routes `/api` and `/uploads` to the API, and runs the import at 06:00 IST every day.

1. Import the repository in Vercel and add MongoDB Atlas from **Storage** (it sets `MONGODB_URI`).
2. Set `JWT_SECRET`, `CRON_SECRET` (Vercel Cron sends it to the import endpoint) and, if the database is shared, `MONGO_DB_NAME`.
3. Deploy, then load jobs once: `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/jobs/import`.

## Credits

CareerPilot is built on [Job Portal](https://github.com/Abhay-0103/Job-Portal-Project) by Abhay Singh, released under the MIT License. The original copyright notice is kept in [LICENSE](./LICENSE).

## License

MIT
