const mongoose = require('mongoose');

// Something that happened for a user: a new application, a status change, a
// message, an interview. The list in the app and the live stream both read it.
const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['application', 'status', 'message', 'interview'],
            required: true,
        },
        title: { type: String, required: true },
        body: String,
        link: String, // page in the app to open
        data: mongoose.Schema.Types.Mixed,
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, _id: -1 });
// keep 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
