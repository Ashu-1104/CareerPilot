# CareerPilot

A full-stack job portal for job seekers and employers. Employers post jobs, review applicants and track hiring; job seekers search, save and apply to jobs with their resume.

## Features

### For job seekers
- Search and filter jobs by keyword, location, category, type and salary
- Save jobs and apply with your resume
- Track every application and its status
- Public profile with skills and resume

### For employers
- Post, edit and close jobs
- Review applicants and update their status
- Hiring analytics dashboard

## Tech stack

React 19, Vite, Tailwind CSS, Framer Motion, Node.js, Express, MongoDB (Mongoose), JWT authentication.

## Getting started

> Node.js 20 or newer and MongoDB are required.

1. Backend: create `backend/.env`:
   ```env
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/careerpilot
   JWT_SECRET=change-me
   ```
   then run `npm install` and `npm run dev` in `backend/`.
2. Frontend: run `npm install` and `npm run dev` in `frontend/`. Set `VITE_API_URL` if the API is not on http://localhost:8000.

## Credits

CareerPilot is built on [Job Portal](https://github.com/Abhay-0103/Job-Portal-Project) by Abhay Singh, released under the MIT License. The original copyright notice is kept in [LICENSE](./LICENSE).

## License

MIT
