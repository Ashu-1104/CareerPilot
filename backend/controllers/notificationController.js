const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const POLL_MS = Number(process.env.STREAM_POLL_MS) || 2000;
// end before the serverless time limit; EventSource reconnects by itself
const MAX_SECONDS = Number(process.env.STREAM_MAX_SECONDS) || 280;

// @desc   Latest notifications and the unread count
// @route  GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const [items, unread] = await Promise.all([
            Notification.find({ user: req.user._id }).sort({ _id: -1 }).limit(30),
            Notification.countDocuments({ user: req.user._id, read: false }),
        ]);
        res.json({ items, unread });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Mark one (or, without an id, all) notifications as read
// @route  POST /api/notifications/read  { id? }
exports.markRead = async (req, res) => {
    try {
        const filter = { user: req.user._id, read: false };
        if (req.body?.id) filter._id = req.body.id;
        await Notification.updateMany(filter, { $set: { read: true } });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   A 2-minute ticket for opening the live stream. EventSource cannot send
//         an Authorization header, and the login token should not go in a URL.
// @route  POST /api/notifications/stream-ticket
exports.getStreamTicket = (req, res) => {
    const ticket = jwt.sign({ id: req.user._id, purpose: 'stream' }, process.env.JWT_SECRET, { expiresIn: '2m' });
    res.json({ ticket });
};

// @desc   Server-Sent Events: each new notification as a "notification" event
// @route  GET /api/notifications/stream?ticket=...
exports.streamNotifications = async (req, res) => {
    let userId;
    try {
        const decoded = jwt.verify(String(req.query.ticket || ''), process.env.JWT_SECRET);
        if (decoded.purpose !== 'stream') throw new Error('wrong ticket');
        userId = new mongoose.Types.ObjectId(String(decoded.id));
    } catch {
        return res.status(401).json({ message: 'Invalid or expired stream ticket' });
    }

    // resume after the last event this browser received, or start from now
    let lastId = mongoose.isValidObjectId(req.get('Last-Event-ID'))
        ? new mongoose.Types.ObjectId(req.get('Last-Event-ID'))
        : (await Notification.findOne({ user: userId }).sort({ _id: -1 }).select('_id'))?._id;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');

    let open = true;
    req.on('close', () => {
        open = false;
    });

    const until = Date.now() + MAX_SECONDS * 1000;
    for (let polls = 1; open && Date.now() < until; polls++) {
        const filter = { user: userId, ...(lastId && { _id: { $gt: lastId } }) };
        const fresh = await Notification.find(filter).sort({ _id: 1 }).limit(50);
        for (const n of fresh) {
            lastId = n._id;
            res.write(`id: ${n._id}\nevent: notification\ndata: ${JSON.stringify(n)}\n\n`);
        }
        if (polls % 10 === 0) res.write(': ping\n\n');
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
    if (open) res.end();
};
