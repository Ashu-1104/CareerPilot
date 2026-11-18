// Global imports
const express = require('express');

// Local imports
const { getPrivateFile } = require('../controllers/fileController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:name', protect, getPrivateFile);

module.exports = router;
