const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Files from older versions were saved on disk here; new uploads go to MongoDB
// (models/Upload.js). Photos and logos are public, resume PDFs private.
const PUBLIC_DIR = path.join(__dirname, '..', 'uploads');
const PRIVATE_DIR = path.join(__dirname, '..', 'private_uploads');
for (const dir of [PUBLIC_DIR, PRIVATE_DIR]) {
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch {
        // read-only file system (Vercel): nothing is stored on disk there
    }
}

// Vercel accepts request bodies up to 4.5 MB; stay under it everywhere.
const MAX_BYTES = 4 * 1024 * 1024;

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.'), false);
    }
};

// Kept in memory, then saved to MongoDB by the upload route
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: MAX_BYTES, files: 1 } });

// A unique, URL-safe file name that keeps the original name readable
const fileNameFor = (file) =>
    `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)}`;

module.exports = upload;
module.exports.PUBLIC_DIR = PUBLIC_DIR;
module.exports.PRIVATE_DIR = PRIVATE_DIR;
module.exports.MAX_BYTES = MAX_BYTES;
module.exports.fileNameFor = fileNameFor;
