// One-off: move resume PDFs uploaded before resumes became private from the
// public uploads folder to private_uploads, and point users and applications
// at the /api/files link. Safe to run more than once.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const Application = require("../models/Application");
const { PRIVATE_DIR, PUBLIC_DIR } = require("../middlewares/uploadMiddleware");

const toPrivate = (url) => (/\/uploads\/[^/]+\.pdf$/i.test(url || "") ? url.replace("/uploads/", "/api/files/") : null);

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    let moved = 0;
    for (const file of fs.readdirSync(PUBLIC_DIR).filter((f) => /\.pdf$/i.test(f))) {
        fs.renameSync(path.join(PUBLIC_DIR, file), path.join(PRIVATE_DIR, file));
        moved += 1;
    }
    let users = 0, apps = 0;
    for (const user of await User.find({ resume: /\/uploads\/[^/]+\.pdf$/i })) {
        user.resume = toPrivate(user.resume);
        await user.save({ validateBeforeSave: false });
        users += 1;
    }
    for (const app of await Application.find({ resume: /\/uploads\/[^/]+\.pdf$/i })) {
        app.resume = toPrivate(app.resume);
        await app.save({ validateBeforeSave: false });
        apps += 1;
    }
    console.log({ pdfsMoved: moved, usersUpdated: users, applicationsUpdated: apps });
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
