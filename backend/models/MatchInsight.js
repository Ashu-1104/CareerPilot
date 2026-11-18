const mongoose = require('mongoose');

// AI-written "why this job fits" and cover letter, saved so the same job and
// resume never ask the AI twice.
const matchInsightSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        resumeParsedAt: Date, // the resume version this was written for
        summary: String,
        coverLetter: String,
    },
    { timestamps: true }
);

matchInsightSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('MatchInsight', matchInsightSchema);
