/**
 * Request Controller
 * Placeholder for Lost Item Requests
 */

// @desc    Get all requests
// @route   GET /api/requests
// @access  Public (Placeholder)
exports.getRequests = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Requests route working',
            data: [],
        });
    } catch (error) {
        next(error);
    }
};
