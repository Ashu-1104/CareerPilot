// One-off: copy files saved on disk by older versions (uploads/, private_uploads/)
// into MongoDB, where new uploads are kept. Links stay the same. Safe to rerun.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Upload = require("../models/Upload");
const User = require("../models/User");
const { PRIVATE_DIR, PUBLIC_DIR } = require("../middlewares/uploadMiddleware");

const TYPES = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

(async () => {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {});
    let copied = 0;
    for (const [dir, isPrivate] of [[PUBLIC_DIR, false], [PRIVATE_DIR, true]]) {
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir)) {
            const type = TYPES[path.extname(name).toLowerCase()];
            if (!type || (await Upload.exists({ name }))) continue;
            const owner = await User.findOne({ $or: [{ resume: new RegExp(`/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }, { avatar: new RegExp(`/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }, { companyLogo: new RegExp(`/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }] }).select("_id");
            const data = fs.readFileSync(path.join(dir, name));
            await Upload.create({ name, owner: owner?._id, contentType: type, size: data.length, private: isPrivate || type === "application/pdf", data });
            copied += 1;
        }
    }
    console.log({ filesCopiedToDatabase: copied });
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
