const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        // imported jobs keep everything in the description
        required: function () { return this.source === "careerpilot"; },
    },
    location: {
        type: String,
    },
    category: {
        type: String,
    },
    type: {
        type: String,
        enum: ["Remote", "Full-time", "Part-time","Full-Time", "Part-Time", "Time", "Contract", "Internship"],
        required: true,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () { return this.source === "careerpilot"; },
    }, // Employer reference (jobs posted on CareerPilot)

    salaryMin: {
        type: Number,
    },
    salaryMax: {
        type: Number,
    },
    isClosed: {
        type: Boolean,
        default: false,
    },

    // Jobs imported from public job boards (services/jobSources.js)
    source: {
        type: String,
        default: "careerpilot",
        index: true,
    },
    externalId: String,
    applyUrl: String,
    companyName: String,
    companyLogoUrl: String,
    tags: [String],
    // when the job was posted, here or on the source board; used to sort newest first
    postedAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    lastSeenAt: Date,
},
    { timestamps: true }
);

jobSchema.index(
    { source: 1, externalId: 1 },
    { unique: true, partialFilterExpression: { externalId: { $type: "string" } } }
);

module.exports = mongoose.model('Job', jobSchema);