// Global imports
const express = require('express');

// Local imports
const { getOverview, refreshResume, getInsight } = require('../controllers/matchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/overview', protect, getOverview);
router.post('/refresh', protect, refreshResume);
router.post('/:jobId/insight', protect, getInsight);

module.exports = router;
