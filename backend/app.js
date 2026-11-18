// The Express app, shared by server.js (a normal server) and api/index.js (Vercel).
// global imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// local imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const savedJobsRoutes = require("./routes/savedJobsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const trackerRoutes = require("./routes/trackerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const matchRoutes = require("./routes/matchRoutes");
const fileRoutes = require("./routes/fileRoutes");
const { servePublicUpload } = require("./controllers/fileController");

const app = express();
// behind Apache / Vercel: take the client's protocol (https) from X-Forwarded-Proto,
// so links built from the request (uploaded files) are https
app.set("trust proxy", 1);

// Middleware to handle CORS
app.use(
    cors({
        origin: "*", // Allow all origins (adjust as needed for security)
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use('/api/jobs', jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/save-jobs", savedJobsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/files", fileRoutes);

// uploaded photos and logos: stored in MongoDB (any host, including Vercel),
// with files from older versions still read from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {}));
app.get('/uploads/:name', servePublicUpload);

module.exports = app;

