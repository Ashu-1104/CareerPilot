const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (token && token.startsWith('Bearer')) {
            token = token.split(' ')[1];  // Extract token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } else {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    } catch (error) {
        res.status(401).json({ message: 'token failed', error: error.message });
    }
};

// Sets req.user when a valid token is sent, and carries on either way
// (for pages anyone can see that show more to logged-in users).
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (token && token.startsWith('Bearer')) {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch {
        // an expired or bad token just means "not logged in" here
    }
    next();
};

module.exports = { protect, optionalAuth };