const Payout = require("./payout.model");

//Create payout
const createPayout = async (req, res) => {
    try {
        const createPayoutObj = await Payout.create(req.body);
        if (createPayoutObj) {
            return res.status(201).json({
                success: true,
                data: createPayoutObj
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payout not created"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For fetching all payouts
const getAllPayouts = async (req, res) => {
    try {
        const getAllPayoutsObj = await Payout
        .find()
        .populate("finderId", "fullName email")
        .populate("paymentId")
        .populate("assignmentId");
        if (getAllPayoutsObj) {
            return res.status(200).json({
                success: true,
                data: getAllPayoutsObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Payouts not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For fetching payout by id
const getPayoutById = async (req, res) => {
    try {
        const getPayoutByIdObj = await Payout
        .findById(req.params.id)
        .populate("finderId", "fullName email")
        .populate("paymentId")
        .populate("assignmentId");
        if (getPayoutByIdObj) {
            return res.status(200).json({
                success: true,
                data: getPayoutByIdObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Payout not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For updating payout
const updatePayout = async (req, res) => {
    try {
        const updatePayoutObj = await Payout.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatePayoutObj) {
            return res.status(200).json({
                success: true,
                data: updatePayoutObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Payout not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For deleting payout
const deletePayout = async (req, res) => {
    try {
        const deletePayoutObj = await Payout.findByIdAndDelete(req.params.id);
        if (deletePayoutObj) {
            return res.status(200).json({
                success: true,
                message: "Payout deleted successfully",
                data: deletePayoutObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Payout not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

module.exports = {
    createPayout,
    getAllPayouts,
    getPayoutById,
    updatePayout,
    deletePayout
}
