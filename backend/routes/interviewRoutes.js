// Global imports
const express = require('express');

// Local imports
const {
    proposeInterview,
    getMyInterviews,
    confirmInterview,
    cancelInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getMyInterviews).post(protect, proposeInterview);
router.post('/:id/confirm', protect, confirmInterview);
router.post('/:id/cancel', protect, cancelInterview);

module.exports = router;
