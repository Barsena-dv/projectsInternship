const Refund = require("./refund.model");
const mongoose = require("mongoose");
const Payment = require("../payments/payment.model");

const processRefund = async (req, res) => {
    try {
        const { paymentId, requestId, refundReason } = req.body;

        if (!paymentId && !requestId) {
            return res.status(400).json({
                success: false,
                message: "paymentId or requestId is required",
            });
        }

        if (paymentId && !mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paymentId",
            });
        }

        if (requestId && !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid requestId",
            });
        }

        const paymentQuery = paymentId ? { _id: paymentId } : { requestId };
        const payment = await Payment.findOne(paymentQuery).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        if (payment.paymentStatus === "refunded") {
            return res.status(409).json({
                success: false,
                message: "Payment is already refunded",
            });
        }

        const refundAmount = Number((payment.amount * 0.7).toFixed(2));
        const now = new Date();

        const refund = await Refund.create({
            paymentId: payment._id,
            requestId: payment.requestId,
            ownerId: payment.ownerId,
            refundAmount,
            refundType: refundAmount >= payment.amount ? "full" : "partial",
            refundReason: refundReason || "Request failed or assignment unsuccessful",
            refundStatus: "processed",
            initiatedAt: now,
            refundedAt: now,
        });

        payment.paymentStatus = "refunded";
        await payment.save();

        return res.status(201).json({
            success: true,
            message: "Refund processed successfully",
            data: {
                refund,
                payment,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
};

//For creating the Refund
const createRefund = async (req, res) => {
    try {
        const createRefundObj = await Refund.create(req.body);
        if (createRefundObj) {
            return res.status(201).json({
                success: true,
                data: createRefundObj
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Refund not created"
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

//For fetching all the Refunds
const getAllRefunds = async (req, res) => {
    try {
        const getAllRefundsObj = await Refund
        .find()
        .populate("ownerId", "fullName email")
        .populate("paymentId")
        .populate("requestId");
        if (getAllRefundsObj) {
            return res.status(200).json({
                success: true,
                data: getAllRefundsObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Refunds not found"
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

//For fetching the Refund by id
const getRefundById = async (req, res) => {
    try {
        const getRefundByIdObj = await Refund
        .findById(req.params.id)
        .populate("ownerId", "fullName email")
        .populate("paymentId")
        .populate("requestId");
        if (getRefundByIdObj) {
            return res.status(200).json({
                success: true,
                data: getRefundByIdObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Refund not found"
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

//For updating the Refund
const updateRefund = async (req, res) => {
    try {
        const updateRefundObj = await Refund.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updateRefundObj) {
            return res.status(200).json({
                success: true,
                data: updateRefundObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Refund not found"
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

//For deleting the Refund
const deleteRefund = async (req, res) => {
    try {
        const deleteRefundObj = await Refund.findByIdAndDelete(req.params.id);
        if (deleteRefundObj) {
            return res.status(200).json({
                success: true,
                message: "Refund deleted successfully",
                data: deleteRefundObj
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Refund not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
}

module.exports = {
    processRefund,
    createRefund,
    getAllRefunds,
    getRefundById,
    updateRefund,
    deleteRefund
}
