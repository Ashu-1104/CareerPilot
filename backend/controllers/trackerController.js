const TrackedJob = require('../models/TrackedJob');
const Job = require('../models/Job');

const { STAGES } = TrackedJob;
const EDITABLE = ['title', 'company', 'location', 'url', 'notes', 'followUpAt'];

const pick = (body) =>
    Object.fromEntries(Object.entries(body || {}).filter(([key]) => EDITABLE.includes(key)));

const onlySeekers = (req, res) => {
    if (req.user.role !== 'jobSeeker') {
        res.status(403).json({ message: 'The tracker is for job seekers' });
        return false;
    }
    return true;
};

// Adds a CareerPilot or imported job to the user's tracker, or moves it forward
// to `stage` if it is already there (never backwards). Used when applying.
exports.trackJob = async (userId, jobId, stage = 'Saved') => {
    const job = await Job.findById(jobId).populate('company', 'companyName name');
    if (!job) return null;

    const existing = await TrackedJob.findOne({ user: userId, job: jobId });
    if (existing) {
        if (STAGES.indexOf(stage) > STAGES.indexOf(existing.stage) && existing.stage !== 'Rejected') {
            existing.stage = stage;
            existing.history.push({ stage });
            await existing.save();
        }
        return existing;
    }
    return TrackedJob.create({
        user: userId,
        job: jobId,
        title: job.title,
        company: job.companyName || job.company?.companyName || job.company?.name,
        location: job.location,
        url: job.applyUrl,
        stage,
        history: [{ stage }],
    });
};

// When an employer decides on an application, move the tracked job to match.
exports.syncFromApplication = async (application) => {
    const stage = { Accepted: 'Offer', Rejected: 'Rejected' }[application.status];
    if (!stage) return;
    const tracked = await TrackedJob.findOne({ user: application.applicant, job: application.job });
    if (tracked && tracked.stage !== stage) {
        tracked.stage = stage;
        tracked.history.push({ stage });
        await tracked.save();
    }
};

// @desc   The user's tracked jobs and simple stats
// @route  GET /api/tracker
exports.getTracker = async (req, res) => {
    try {
        if (!onlySeekers(req, res)) return;
        const items = await TrackedJob.find({ user: req.user._id }).sort({ updatedAt: -1 });

        const reached = (stage) =>
            items.filter((i) => i.history.some((h) => STAGES.indexOf(h.stage) >= STAGES.indexOf(stage) && h.stage !== 'Rejected') || i.stage === stage).length;
        const applied = items.filter((i) => i.history.some((h) => h.stage !== 'Saved')).length;
        const interviews = reached('Interview');
        const offers = reached('Offer');
        const now = new Date();

        res.json({
            items,
            stages: STAGES,
            stats: {
                total: items.length,
                applied,
                interviews,
                offers,
                interviewRate: applied ? Math.round((interviews / applied) * 100) : 0,
                offerRate: applied ? Math.round((offers / applied) * 100) : 0,
                followUpsDue: items.filter((i) => i.followUpAt && i.followUpAt <= now && !['Offer', 'Rejected'].includes(i.stage)).length,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Track a job: { jobId, stage } for a CareerPilot/imported job, or
//         { title, company, location, url, stage } for one from another site
// @route  POST /api/tracker
exports.addTrackedJob = async (req, res) => {
    try {
        if (!onlySeekers(req, res)) return;
        const stage = STAGES.includes(req.body.stage) ? req.body.stage : 'Saved';

        if (req.body.jobId) {
            const tracked = await exports.trackJob(req.user._id, req.body.jobId, stage);
            if (!tracked) return res.status(404).json({ message: 'Job not found' });
            return res.status(201).json(tracked);
        }

        const fields = pick(req.body);
        if (!fields.title) return res.status(400).json({ message: 'Job title is required' });
        const tracked = await TrackedJob.create({ ...fields, user: req.user._id, stage, history: [{ stage }] });
        res.status(201).json(tracked);
    } catch (error) {
        res.status(error.name === 'ValidationError' ? 400 : 500).json({ message: error.message });
    }
};

// @desc   Move a tracked job to another stage and/or edit its details
// @route  PATCH /api/tracker/:id
exports.updateTrackedJob = async (req, res) => {
    try {
        if (!onlySeekers(req, res)) return;
        const tracked = await TrackedJob.findOne({ _id: req.params.id, user: req.user._id });
        if (!tracked) return res.status(404).json({ message: 'Tracked job not found' });

        Object.assign(tracked, pick(req.body));
        if (req.body.followUpAt === null || req.body.followUpAt === '') tracked.followUpAt = undefined;
        if (req.body.stage && req.body.stage !== tracked.stage) {
            if (!STAGES.includes(req.body.stage)) return res.status(400).json({ message: 'Unknown stage' });
            tracked.stage = req.body.stage;
            tracked.history.push({ stage: req.body.stage });
        }
        await tracked.save();
        res.json(tracked);
    } catch (error) {
        res.status(error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};

// @desc   Remove a job from the tracker
// @route  DELETE /api/tracker/:id
exports.deleteTrackedJob = async (req, res) => {
    try {
        if (!onlySeekers(req, res)) return;
        const result = await TrackedJob.deleteOne({ _id: req.params.id, user: req.user._id });
        if (!result.deletedCount) return res.status(404).json({ message: 'Tracked job not found' });
        res.json({ message: 'Removed from tracker' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
