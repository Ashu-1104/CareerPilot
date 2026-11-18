// Runs the API as a normal long-lived server (local development, server 165).
// On Vercel, api/index.js uses app.js directly.
require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");

// Connect to the database
connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
