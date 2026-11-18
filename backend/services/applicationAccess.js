const mongoose = require('mongoose');
const Application = require('../models/Application');

// Loads an application with its job, but only for the two people on it: the
// candidate who applied and the employer who posted the job. Returns
// { application, isEmployer, otherUserId } or null.
exports.applicationFor = async (applicationId, user) => {
    if (!mongoose.isValidObjectId(applicationId)) return null;
    const application = await Application.findById(applicationId).populate('job', 'title company');
    if (!application?.job) return null;

    const userId = String(user._id);
    const isEmployer = String(application.job.company) === userId;
    const isCandidate = String(application.applicant) === userId;
    if (!isEmployer && !isCandidate) return null;

    return {
        application,
        isEmployer,
        otherUserId: isEmployer ? application.applicant : application.job.company,
    };
};
