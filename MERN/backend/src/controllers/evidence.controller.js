/**
 * Evidence Controller
 * Placeholder for Found Item Evidence
 */

// @desc    Get all evidence records
// @route   GET /api/evidence
// @access  Public (Placeholder)
exports.getEvidence = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Evidence route working',
            data: [],
        });
    } catch (error) {
        next(error);
    }
};
