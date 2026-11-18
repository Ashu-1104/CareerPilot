const moment = require('moment');
const Interview = require('../models/Interview');
const { applicationFor } = require('../services/applicationAccess');
const { notify } = require('../services/notify');
const { trackJob } = require('./trackerController');

const when = (date) => moment(date).utcOffset('+05:30').format('ddd D MMM, h:mm A') + ' IST';

// @desc   Employer proposes interview slots for an application
// @route  POST /api/interviews  { applicationId, slots: [ISO dates], durationMins, mode, location, note }
exports.proposeInterview = async (req, res) => {
    try {
        const access = await applicationFor(req.body?.applicationId, req.user);
        if (!access || !access.isEmployer) return res.status(404).json({ message: 'Application not found' });

        const slots = (req.body.slots || []).map((s) => new Date(s)).filter((d) => !isNaN(d));
        if (!slots.length || slots.some((d) => d < new Date())) {
            return res.status(400).json({ message: 'Choose between 1 and 5 time slots in the future' });
        }
        // a new proposal replaces any open one
        await Interview.updateMany(
            { application: access.application._id, status: 'Proposed' },
            { $set: { status: 'Cancelled' } }
        );
        const interview = await Interview.create({
            application: access.application._id,
            job: access.application.job._id,
            employer: req.user._id,
            candidate: access.application.applicant,
            slots: slots.sort((a, b) => a - b),
            durationMins: req.body.durationMins,
            mode: req.body.mode,
            location: req.body.location,
            note: req.body.note,
        });

        await notify(access.application.applicant, {
            type: 'interview',
            title: `Interview invitation: ${access.application.job.title}`,
            body: `${req.user.companyName || req.user.name} offered ${slots.length} time slot${slots.length > 1 ? 's' : ''}. Pick one.`,
            link: '/interviews',
            data: { interviewId: interview._id },
        });
        res.status(201).json(interview);
    } catch (error) {
        res.status(error.name === 'ValidationError' ? 400 : 500).json({ message: error.message });
    }
};

// @desc   The user's interviews (as employer or candidate), soonest first
// @route  GET /api/interviews
exports.getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({
            $or: [{ employer: req.user._id }, { candidate: req.user._id }],
            status: { $ne: 'Cancelled' },
        })
            .populate('job', 'title location')
            .populate('employer', 'name companyName companyLogo')
            .populate('candidate', 'name email avatar')
            .sort({ scheduledAt: 1, createdAt: -1 });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Candidate picks one of the proposed slots
// @route  POST /api/interviews/:id/confirm  { slot }
exports.confirmInterview = async (req, res) => {
    try {
        const interview = await Interview.findOne({ _id: req.params.id, candidate: req.user._id }).populate('job', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        if (interview.status !== 'Proposed') return res.status(400).json({ message: `This interview is already ${interview.status.toLowerCase()}` });

        const slot = interview.slots.find((s) => s.getTime() === new Date(req.body?.slot).getTime());
        if (!slot) return res.status(400).json({ message: 'Pick one of the offered time slots' });

        interview.status = 'Confirmed';
        interview.scheduledAt = slot;
        await interview.save();
        await trackJob(req.user._id, interview.job._id, 'Interview');

        await notify(interview.employer, {
            type: 'interview',
            title: `Interview confirmed: ${interview.job.title}`,
            body: `${req.user.name} picked ${when(slot)}.`,
            link: '/interviews',
            data: { interviewId: interview._id },
        });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Either side cancels an interview
// @route  POST /api/interviews/:id/cancel
exports.cancelInterview = async (req, res) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            $or: [{ employer: req.user._id }, { candidate: req.user._id }],
        }).populate('job', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        interview.status = 'Cancelled';
        await interview.save();
        const other = String(interview.employer) === String(req.user._id) ? interview.candidate : interview.employer;
        await notify(other, {
            type: 'interview',
            title: `Interview cancelled: ${interview.job.title}`,
            body: `${req.user.name} cancelled the interview.`,
            link: '/interviews',
            data: { interviewId: interview._id },
        });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
