const mongoose = require('mongoose');

// A job on a seeker's personal application tracker (kanban board). It can be a
// CareerPilot job, an imported job, or one added by hand from another site.
const STAGES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

const trackedJobSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        }, // empty for jobs added by hand
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        company: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        url: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        stage: {
            type: String,
            enum: STAGES,
            default: 'Saved',
        },
        notes: {
            type: String,
            maxlength: 5000,
            default: '',
        },
        followUpAt: Date,
        // every stage the job has been in, newest last
        history: [
            {
                stage: { type: String, enum: STAGES },
                at: { type: Date, default: Date.now },
                _id: false,
            },
        ],
    },
    { timestamps: true }
);

trackedJobSchema.index(
    { user: 1, job: 1 },
    { unique: true, partialFilterExpression: { job: { $type: 'objectId' } } }
);

trackedJobSchema.statics.STAGES = STAGES;

module.exports = mongoose.model('TrackedJob', trackedJobSchema);
