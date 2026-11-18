const Notification = require('../models/Notification');

// Saves a notification; open streams (controllers/notificationController.js)
// pick it up within a couple of seconds. Never throws: a failed notification
// must not fail the action that caused it.
exports.notify = async (userId, { type, title, body, link, data }) => {
    try {
        if (!userId) return;
        await Notification.create({ user: userId, type, title, body, link, data });
    } catch (error) {
        console.error('notify failed:', error.message);
    }
};
