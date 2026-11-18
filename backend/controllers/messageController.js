const Message = require('../models/Message');
const { applicationFor } = require('../services/applicationAccess');
const { notify } = require('../services/notify');

// @desc   Messages on an application; marks the other side's messages as read
// @route  GET /api/applications/:id/messages
exports.getMessages = async (req, res) => {
    try {
        const access = await applicationFor(req.params.id, req.user);
        if (!access) return res.status(404).json({ message: 'Conversation not found' });

        const messages = await Message.find({ application: req.params.id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name avatar role');
        await Message.updateMany(
            { application: req.params.id, sender: { $ne: req.user._id }, readAt: null },
            { $set: { readAt: new Date() } }
        );
        res.json({ messages, job: access.application.job.title });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Send a message on an application
// @route  POST /api/applications/:id/messages  { text }
exports.sendMessage = async (req, res) => {
    try {
        const access = await applicationFor(req.params.id, req.user);
        if (!access) return res.status(404).json({ message: 'Conversation not found' });
        const text = String(req.body?.text || '').trim();
        if (!text) return res.status(400).json({ message: 'Message is empty' });

        const message = await Message.create({ application: req.params.id, sender: req.user._id, text: text.slice(0, 2000) });
        await message.populate('sender', 'name avatar role');

        await notify(access.otherUserId, {
            type: 'message',
            title: `New message from ${req.user.name}`,
            body: text.slice(0, 140),
            link: access.isEmployer
                ? `/job/${access.application.job._id}?chat=1`
                : `/applicants?job=${access.application.job._id}&chat=${req.params.id}`,
            data: { applicationId: req.params.id, job: access.application.job.title },
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
