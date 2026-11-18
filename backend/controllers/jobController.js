const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const { SOURCE_INFO } = require('../services/jobSources');
const { importJobs } = require('../services/jobImport');

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Imported jobs carry their company inline; give them the same `company` shape
// as posted jobs, plus where they came from.
const withCompany = (job) => {
    const data = job.toObject ? job.toObject() : job;
    if (data.source === 'careerpilot' || !data.source) return data;
    return {
        ...data,
        company: { companyName: data.companyName, companyLogo: data.companyLogoUrl },
        sourceInfo: SOURCE_INFO[data.source] || { name: data.source, url: null },
    };
};


// @desc   Create a new job posting (Employer only)
exports.createJob = async (req, res) => {
    try {
        if (req.user.role !== 'employer') {
            return res.status(403).json({ message: 'Only employers can create job postings' });
        }

        const job = await Job.create({ ...req.body, company: req.user._id });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getJobs = async (req, res) => {

    const {
        keyword,
        location,
        category,
        type,
        minSalary,
        maxSalary,
        userId,
        source, // "careerpilot" (posted here), "external" (imported) or empty for all
    } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const query = {
        isClosed: false,
        ...(keyword && {
            $or: [
                { title: { $regex: escapeRegex(keyword), $options: 'i' } },
                { companyName: { $regex: escapeRegex(keyword), $options: 'i' } },
                { tags: { $regex: escapeRegex(keyword), $options: 'i' } },
            ],
        }),
        ...(location && { location: { $regex: escapeRegex(location), $options: 'i' } }),
        ...(source === 'careerpilot' && { source: 'careerpilot' }),
        ...(source === 'external' && { source: { $ne: 'careerpilot' } }),
        ...(category && { category }),
        ...(type && { type }),
    };

    if (minSalary || maxSalary) {
        query.$and = [];

        if (minSalary) {
            query.$and.push({ salaryMax: { $gte: Number(minSalary) } });
        }
        if (maxSalary) {
            query.$and.push({ salaryMin: { $lte: Number(maxSalary) } });
        }

        if (query.$and.length === 0) {
            delete query.$and;
        }
    }

    try {
        const [jobs, total] = await Promise.all([
            Job.find(query)
                .sort({ postedAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('company', 'name companyName companyLogo'),
            Job.countDocuments(query),
        ]);

        let SavedJobIds = [];
        let appliedJobStatusMap = {};

        if (userId) {
            // Get saved jobs for the user
            const savedJobs = await SavedJob.find({ jobSeeker: userId }).select('job');
            SavedJobIds = savedJobs.map((s) => String(s.job));

            // Applications
            const applications = await Application.find({ applicant: userId }).select('job status');
            applications.forEach((app) => {
                appliedJobStatusMap[String(app.job)] = app.status;
            });
        }

        // Add isSaved and applicationStatus fields
        const jobsWithExtras = jobs.map((job) => {
            const jobIdStr = String(job._id);
            return {
                ...withCompany(job),
                isSaved: SavedJobIds.includes(jobIdStr),
                applicationStatus: appliedJobStatusMap[jobIdStr] || null,
            };
        });

        res.json({ jobs: jobsWithExtras, total, page, pages: Math.ceil(total / limit) });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get jobs posted by the logged-in user (Employer only)
exports.getJobsEmployer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { role } = req.user;

        if (role !== 'employer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get all jobs posted by this employer
        const jobs = await Job.find({ company: userId })
            .populate('company', 'name companyName companyLogo')
            .lean(); // .lean() to get plain JS objects

        // Count applications for each job
        const jobsWithApplicationCounts = await Promise.all(
            jobs.map(async (job) => {
                const applicationCount = await Application.countDocuments({
                    job: job._id,
                });
                return {
                    ...job,
                    applicationCount,
                };
            })
        );

        res.json(jobsWithApplicationCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get single job by ID
exports.getJobById = async (req, res) => {
    try {
        const { userId } = req.query;

        const job = await Job.findById(req.params.id).populate(
            'company',
            'name companyName companyLogo'
        );

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        let applicationStatus = null;

        if (userId) {
            const application = await Application.findOne({
                job: job._id,
                applicant: userId,
            }).select('status');

            if (application) {
                applicationStatus = application.status;
            }
        }

        res.json({
            ...withCompany(job),
            applicationStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Update a job posting (Employer only)
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.company.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Unauthorized' });
        }

        Object.assign(job, req.body);
        const updated = await job.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Delete a job posting (Employer only)
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.company.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not Authorized to delete this job' });
        }

        await job.deleteOne();
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Toggle job open/close status (Employer only)
exports.toggleCloseJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.company.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Not Authorized to update this job' });
        }

        job.isClosed = !job.isClosed;
        await job.save();

        res.json({ message: "Job marked as closed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc   Import jobs from public job boards (daily cron, or `npm run import-jobs`)
// @access Requests with the CRON_SECRET bearer token, which Vercel Cron sends
exports.runJobImport = async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.get('Authorization') !== `Bearer ${secret}`) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    try {
        res.json(await importJobs());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
