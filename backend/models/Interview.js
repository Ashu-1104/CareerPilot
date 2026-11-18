const mongoose = require('mongoose');

// An interview for one application: the employer proposes time slots, the
// candidate picks one.
const interviewSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: true,
        },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        slots: {
            type: [Date],
            validate: [(slots) => slots.length >= 1 && slots.length <= 5, 'Offer between 1 and 5 time slots'],
        },
        durationMins: { type: Number, default: 30, min: 15, max: 240 },
        mode: { type: String, enum: ['Video', 'Phone', 'In person'], default: 'Video' },
        location: { type: String, trim: true, maxlength: 500 }, // meeting link, phone number or address
        note: { type: String, trim: true, maxlength: 1000 },
        status: { type: String, enum: ['Proposed', 'Confirmed', 'Cancelled'], default: 'Proposed' },
        scheduledAt: Date, // the slot the candidate picked
    },
    { timestamps: true }
);

interviewSchema.index({ employer: 1, status: 1 });
interviewSchema.index({ candidate: 1, status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
