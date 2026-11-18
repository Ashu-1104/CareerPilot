const { sendError } = require('../services/httpError');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { refreshResumeSkills } = require('../services/resumeParser');

// @desc   Update user profile (name, avatar, company details)
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar, companyName, companyDescription, companyLogo, resume, jobAlerts } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resumeChanged = Boolean(resume) && resume !== user.resume;
        user.name = name || user.name;
        user.avatar = avatar || user.avatar;
        user.resume = resume || user.resume;
        if (typeof jobAlerts === 'boolean') user.set('jobAlerts.enabled', jobAlerts);

        // If employer, update company details
        if (user.role === 'employer') {
            user.companyName = companyName || user.companyName;
            user.companyDescription = companyDescription || user.companyDescription;
            user.companyLogo = companyLogo || user.companyLogo;
        }
        await user.save();

        // a new resume: read its skills for job match scores
        let resumeParse;
        if (user.role === 'jobSeeker' && (resumeChanged || (user.resume && !user.resumeParsedAt))) {
            resumeParse = await refreshResumeSkills(user);
        }

        res.json({
            ...(resumeParse && { resumeSkills: user.resumeSkills || [], resumeParseError: resumeParse.error }),
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            companyName: user.companyName,
            companyDescription: user.companyDescription,
            companyLogo: user.companyLogo,
            resume: user.resume || "",
            jobAlerts: user.jobAlerts?.enabled !== false,
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        sendError(res, err);
    }
};

// @desc   Delete user resume
exports.deleteResume = async (req, res) => {
    try {
        const { resumeUrl } = req.body; // URL of the resume to be deleted

        if (!resumeUrl) {
            return res.status(400).json({ message: 'Resume URL is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== "jobSeeker") {
            return res.status(403).json({ message: 'Only jobSeekers can delete resumes' });
        }

        // Only ever the user's own resume (never a file named in the request)
        const filename = user.resume ? path.basename(user.resume.split('?')[0]) : '';

        if (filename) {
            const { PRIVATE_DIR, PUBLIC_DIR } = require('../middlewares/uploadMiddleware');
            const dir = user.resume.includes('/api/files/') ? PRIVATE_DIR : PUBLIC_DIR;
            const filePath = path.join(dir, filename);

            // Check if file exists and delete
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // delete file from server
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.log(`File not found on server: ${filePath}`);
            }
        }

        // Set user's resume field to null or empty string
        user.resume = '';
        user.resumeSkills = undefined;
        user.resumeParsedAt = undefined;
        await user.save();

        res.json({ message: 'Resume deleted successfully', user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            resume: user.resume
        }});
    } catch (err) {
        console.error('Error deleting resume:', err);
        sendError(res, err);
    }
};


// @desc   Get public user profile by ID
exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        sendError(res, err);
    }
};
