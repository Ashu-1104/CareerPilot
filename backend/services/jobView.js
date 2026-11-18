const { SOURCE_INFO } = require('./jobSources');
const { matchScore } = require('./skills');

// Imported jobs carry their company inline; give them the same `company` shape
// as posted jobs, plus where they came from.
exports.withCompany = (job) => {
    const data = job.toObject ? job.toObject() : job;
    if (data.source === 'careerpilot' || !data.source) return data;
    return {
        ...data,
        company: { companyName: data.companyName, companyLogo: data.companyLogoUrl },
        sourceInfo: SOURCE_INFO[data.source] || { name: data.source, url: null },
    };
};

// The logged-in job seeker's match for a job (only their own; never from a query parameter).
exports.matchFor = (req, job) =>
    req.user?.role === 'jobSeeker' && req.user.resumeSkills?.length
        ? matchScore(req.user.resumeSkills, job.skills)
        : undefined;
