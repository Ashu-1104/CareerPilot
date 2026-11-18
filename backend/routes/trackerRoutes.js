// Global imports
const express = require('express');

// Local imports
const {
    getTracker,
    addTrackedJob,
    updateTrackedJob,
    deleteTrackedJob,
} = require('../controllers/trackerController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getTracker).post(protect, addTrackedJob);
router.route('/:id').patch(protect, updateTrackedJob).delete(protect, deleteTrackedJob);

module.exports = router;
