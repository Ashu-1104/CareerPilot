// Global imports
const express = require('express');

// Local imports
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Logged-in users only; 5 MB at most. Resumes (PDF) get a private /api/files link.
router.post("/upload-image", protect, (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            const tooBig = err.code === "LIMIT_FILE_SIZE";
            return res.status(tooBig ? 413 : 400).json({ message: tooBig ? "File is larger than 5 MB" : err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const folder = req.file.mimetype === "application/pdf" ? "api/files" : "uploads";
        const imageUrl = `${req.protocol}://${req.get("host")}/${folder}/${req.file.filename}`;
        res.status(200).json({ imageUrl });
    });
});


module.exports = router;