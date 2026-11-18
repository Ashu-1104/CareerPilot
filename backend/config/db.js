const mongoose = require('mongoose');

// MONGO_URI locally; MONGODB_URI is what Vercel's MongoDB Atlas integration sets.
// MONGO_DB_NAME picks the database when the URI is shared with other apps.
const mongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI;
const options = () => (process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {});

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri(), options());
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    }
};

// Serverless: connect once per instance and reuse it; retry on the next
// request if connecting failed.
let connecting;
const ensureDb = () => {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    connecting ??= mongoose
        .connect(mongoUri(), { ...options(), serverSelectionTimeoutMS: 10000 })
        .catch((err) => {
            connecting = undefined;
            throw err;
        });
    return connecting;
};

module.exports = connectDB;
module.exports.ensureDb = ensureDb;
