const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Upload = require('../models/Upload');
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

        if (!allowed) return res.status(404).json({ message: 'File not found' });
        res.set('Cache-Control', 'private, no-store');
        res.set('Content-Disposition', `inline; filename="${name}"`);

        const stored = await Upload.findOne({ name, private: true }).select('data contentType');
        if (stored) return res.type(stored.contentType).send(stored.data);
        // resumes saved on disk by older versions
        if (fs.existsSync(file)) return res.sendFile(file, { headers: { 'Content-Type': 'application/pdf' } });
        res.status(404).json({ message: 'File not found' });
    } catch (error) {
        res.status(500).json({ message: 'Could not open the file' });
    }
};

// @desc   A public upload (photo or logo) stored in MongoDB
// @route  GET /uploads/:name
exports.servePublicUpload = async (req, res) => {
    try {
        const stored = await Upload.findOne({ name: path.basename(req.params.name), private: false }).select('data contentType');
        if (!stored) return res.status(404).json({ message: 'File not found' });
        res.set('Cache-Control', 'public, max-age=86400, immutable');
        res.type(stored.contentType).send(stored.data);
    } catch {
        res.status(404).json({ message: 'File not found' });
    }
};
