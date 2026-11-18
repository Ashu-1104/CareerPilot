// Global imports
const express = require('express');

// Local imports
const {
    getNotifications,
    markRead,
    getStreamTicket,
    streamNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/read', protect, markRead);
router.post('/stream-ticket', protect, getStreamTicket);
router.get('/stream', streamNotifications); // authenticated by the ticket

module.exports = router;
