const Job = require('../models/Job');
const User = require('../models/User');
const { matchScore } = require('./skills');
const { notify } = require('./notify');

const MIN_SCORE = 70;

// After the daily import: tell each job seeker (with a resume and alerts on)
// about open jobs added since their last alert that match their resume well.
// One notification per person, and none when nothing new matches.
exports.sendJobAlerts = async (now = new Date()) => {
    const seekers = await User.find({
        role: 'jobSeeker',
        'resumeSkills.0': { $exists: true },
        'jobAlerts.enabled': { $ne: false },
    }).select('resumeSkills jobAlerts');

    let sent = 0;
    for (const seeker of seekers) {
        // first alert: look back one day
        const since = seeker.jobAlerts?.lastSentAt || new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const fresh = await Job.find({ isClosed: false, createdAt: { $gt: since, $lte: now } }).select('title companyName company skills');

        const matches = fresh
            .map((job) => ({ job, score: matchScore(seeker.resumeSkills, job.skills)?.score ?? 0 }))
            .filter((m) => m.score >= MIN_SCORE)
            .sort((a, b) => b.score - a.score);

        if (matches.length) {
            const top = matches.slice(0, 3).map((m) => `${m.job.title} (${m.score}%)`);
            await notify(seeker._id, {
                type: 'alert',
                title: `${matches.length} new job${matches.length > 1 ? 's' : ''} match your resume`,
                body: top.join(', ') + (matches.length > 3 ? ` and ${matches.length - 3} more` : ''),
                link: `/find-jobs?new=${encodeURIComponent(since.toISOString())}`,
                data: { count: matches.length, since },
            });
            sent += 1;
        }
        await User.updateOne({ _id: seeker._id }, { $set: { 'jobAlerts.lastSentAt': now } });
    }
    return { seekers: seekers.length, alertsSent: sent };
};
