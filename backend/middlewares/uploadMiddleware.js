const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Photos and logos are public (shown on pages); resume PDFs are private and
// only served through /api/files to people allowed to see them.
const PUBLIC_DIR = path.join(__dirname, '..', 'uploads');
const PRIVATE_DIR = path.join(__dirname, '..', 'private_uploads');
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(PRIVATE_DIR, { recursive: true });

const MAX_BYTES = 5 * 1024 * 1024;

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.mimetype === 'application/pdf' ? PRIVATE_DIR : PUBLIC_DIR);
    },
    filename: (req, file, cb) => {
        // keep only safe characters from the original name
        const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
        cb(null, `${Date.now()}-${safe}`);
    },
});

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

// Initialize multer with the defined storage, file filter and a 5 MB limit
const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: 1 } });

module.exports = upload;
module.exports.PUBLIC_DIR = PUBLIC_DIR;
module.exports.PRIVATE_DIR = PRIVATE_DIR;
