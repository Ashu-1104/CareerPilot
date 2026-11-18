const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { PRIVATE_DIR } = require('../middlewares/uploadMiddleware');

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc   A private file (resume PDF): for its owner, and for employers the
//         owner has applied to
// @route  GET /api/files/:name
exports.getPrivateFile = async (req, res) => {
    try {
        const name = path.basename(req.params.name);
        const file = path.join(PRIVATE_DIR, name);
        const endsWith = { $regex: `/${escapeRegex(name)}$` };

        const owner = await User.findOne({ resume: endsWith }).select('_id');
        let allowed = owner && String(owner._id) === String(req.user._id);

        if (!allowed && req.user.role === 'employer') {
            const myJobs = await Job.find({ company: req.user._id }).distinct('_id');
            allowed = Boolean(
                await Application.exists({
                    job: { $in: myJobs },
                    $or: [{ resume: endsWith }, ...(owner ? [{ applicant: owner._id }] : [])],
                })
            );
        }

        if (!allowed || !fs.existsSync(file)) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.set('Cache-Control', 'private, no-store');
        res.sendFile(file, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${name}"` } });
    } catch (error) {
        res.status(500).json({ message: 'Could not open the file' });
    }
};
