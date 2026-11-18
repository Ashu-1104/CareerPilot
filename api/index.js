// Vercel serverless entry: the whole Express API as one function.
const app = require("../backend/app");
const { ensureDb } = require("../backend/config/db");

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
