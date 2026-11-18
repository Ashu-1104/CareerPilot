// Global imports
const express = require('express');

// Local imports
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { fileNameFor } = require('../middlewares/uploadMiddleware');
const Upload = require('../models/Upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Logged-in users only; 4 MB at most. Saved in MongoDB; resumes (PDF) are
// private and get an /api/files link, photos a public /uploads link.
router.post("/upload-image", protect, (req, res) => {
    upload.single("image")(req, res, async (err) => {
        if (err) {
            const tooBig = err.code === "LIMIT_FILE_SIZE";
            return res.status(tooBig ? 413 : 400).json({ message: tooBig ? "File is larger than 4 MB" : err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        try {
            const isPdf = req.file.mimetype === "application/pdf";
            const name = fileNameFor(req.file);
            await Upload.create({
                name,
                owner: req.user._id,
                contentType: req.file.mimetype,
                size: req.file.size,
                private: isPdf,
                data: req.file.buffer,
            });
            const imageUrl = `${req.protocol}://${req.get("host")}/${isPdf ? "api/files" : "uploads"}/${name}`;
            res.status(200).json({ imageUrl });
        } catch (error) {
            res.status(500).json({ message: "Could not save the file" });
        }
    });
});


module.exports = router;