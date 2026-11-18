// Vercel entry for the API service: the Express app with one cached database
// connection per instance (server.js is the entry everywhere else).
const app = require("./app");
const { ensureDb } = require("./config/db");

module.exports = async (req, res) => {
    try {
        await ensureDb();
    } catch (error) {
        console.error("Database unavailable:", error.message);
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Database unavailable, please retry" }));
        return;
    }
    return app(req, res);
};
