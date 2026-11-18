// Global imports
const express = require('express');

// Local imports
const {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob,
    toggleCloseJob,
    getJobsEmployer,
    runJobImport,
    getJobStats,
} = require('../controllers/jobController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createJob).get(optionalAuth, getJobs);
router.get('/import', runJobImport);
router.get('/stats', getJobStats);
router.route('/get-jobs-employer').get(protect, getJobsEmployer);
router.route('/:id').get(optionalAuth, getJobById).put(protect, updateJob).delete(protect, deleteJob);
router.put('/:id/toggle-close', protect, toggleCloseJob);

module.exports = router;