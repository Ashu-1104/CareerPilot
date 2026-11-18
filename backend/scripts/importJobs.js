// npm run import-jobs: fetch jobs from the public job boards into MongoDB.
require("dotenv").config();
const mongoose = require("mongoose");
const { importJobs } = require("../services/jobImport");

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(await importJobs());
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
