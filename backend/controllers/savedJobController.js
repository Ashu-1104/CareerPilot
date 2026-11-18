const { sendError } = require('../services/httpError');
const { withCompany, matchFor } = require('../services/jobView');
const SavedJob = require('../models/SavedJob');

// Save a job
exports.saveJob = async (req, res) => {
    try {
        const exists = await SavedJob.findOne({ job: req.params.jobId, jobSeeker: req.user._id });
        if (exists) {
            return res.status(400).json({ message: "Job already saved" });
        }

        const saved = await SavedJob.create({
            job: req.params.jobId,
            jobSeeker: req.user._id
        });
        res.status(201).json(saved);
    } catch (err) {
        sendError(res, err);
    }
};

// Unsave a job
exports.unsaveJob = async (req, res) => {
     try {
        await SavedJob.findOneAndDelete({ job: req.params.jobId, jobSeeker: req.user._id });
        res.json({ message: "Job removed from saved list" });
    } catch (err) {
        sendError(res, err);
    }
};

// Get saved jobs for current user
exports.getMySavedJobs = async (req, res) => {
     try {
        const savedJobs = await SavedJob.find({ jobSeeker: req.user._id })
        .populate({
            path: 'job',
            populate: {
                path: "company",
                select: "name companyName companyLogo"
            },
     });
        // a saved job whose posting was deleted has job = null: leave it out
        res.json(
            savedJobs
                .filter((saved) => saved.job)
                .map((saved) => ({
                    ...saved.toObject(),
                    job: { ...withCompany(saved.job), match: matchFor(req, saved.job), isSaved: true },
                }))
        );
    } catch (err) {
        sendError(res, err);
    }
};