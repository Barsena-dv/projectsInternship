/**
 * Dispute Controller
 * Placeholder for Disputes
 */

// @desc    Get all disputes
// @route   GET /api/disputes
// @access  Public (Placeholder)
exports.getDisputes = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Disputes route working',
            data: [],
        });
    } catch (error) {
        next(error);
    }
};
