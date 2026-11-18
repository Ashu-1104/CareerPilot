const mongoose = require('mongoose');

// An uploaded file kept in MongoDB, so uploads work on hosts without a disk
// (Vercel). Photos and logos are public; resume PDFs are private.
const uploadSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true }, // the file name in its URL
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        contentType: { type: String, required: true },
        size: Number,
        private: { type: Boolean, default: false },
        data: { type: Buffer, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
