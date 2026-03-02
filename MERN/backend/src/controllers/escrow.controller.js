/**
 * Escrow Controller
 * Placeholder for Escrow Transactions
 */

// @desc    Get all escrow records
// @route   GET /api/escrow
// @access  Public (Placeholder)
exports.getEscrow = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Escrow route working',
            data: [],
        });
    } catch (error) {
        next(error);
    }
};
