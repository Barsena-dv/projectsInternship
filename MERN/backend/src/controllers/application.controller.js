/**
 * Application Controller
 * Placeholder for Finder Applications
 */

// @desc    Get all applications
// @route   GET /api/applications
// @access  Public (Placeholder)
exports.getApplications = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Applications route working',
            data: [],
        });
    } catch (error) {
        next(error);
    }
};
