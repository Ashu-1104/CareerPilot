const mongoose = require('mongoose');

// A chat message between an employer and a candidate about one application.
const messageSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        readAt: Date,
    },
    { timestamps: true }
);

messageSchema.index({ application: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
