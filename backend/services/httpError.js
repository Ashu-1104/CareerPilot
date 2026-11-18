// Sends the right status for an error caught in a controller: a malformed id
// is "not found" and invalid input is a 400, never a server error.
exports.sendError = (res, error, notFound = 'Not found') => {
    if (error?.name === 'CastError') return res.status(404).json({ message: notFound });
    if (error?.name === 'ValidationError') return res.status(400).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
