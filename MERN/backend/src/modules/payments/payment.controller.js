const Payment = require("./payment.model");
const mongoose = require("mongoose");
const LostItemRequest = require("../requests/request.model");

const lockPayment = async (req, res) => {
    try {
        const { requestId, amount } = req.body;

        if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: "Valid requestId is required",
            });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number",
            });
        }

        const request = await LostItemRequest.findById(requestId).select("ownerId planId");
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (request.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only request owner can lock payment",
            });
        }

        const existingPayment = await Payment
            .findOne({
                requestId,
                ownerId: req.user.id,
                paymentStatus: { $in: ["unpaid", "locked", "released"] },
            })
            .sort({ createdAt: -1 });

        if (existingPayment) {
            return res.status(409).json({
                success: false,
                message: "Payment already exists for this request",
                data: existingPayment,
            });
        }

        const payment = await Payment.create({
            requestId,
            ownerId: req.user.id,
            planId: request.planId,
            amount: parsedAmount,
            paymentStatus: "locked",
            paidAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: "Payment locked successfully",
            data: payment,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
};


// CREATE PAYMENT
const createPayment = async (req, res) => {
    try {

        const createPaymentObj = await Payment.create(req.body);

        res.status(201).json({
            success: true,
            data: createPaymentObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};



// GET ALL PAYMENTS
const getAllPayments = async (req, res) => {
    try {

        const getAllPaymentsObj = await Payment
            .find()
            .populate("ownerId", "fullName email")
            .populate("requestId")
            .populate("planId", "planName");

        res.status(200).json({
            success: true,
            data: getAllPaymentsObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};



// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
    try {

        const getPaymentByIdObj = await Payment
            .findById(req.params.id)
            .populate("ownerId", "fullName email")
            .populate("requestId")
            .populate("planId", "planName");

        if (getPaymentByIdObj) {
            res.status(200).json({
                success: true,
                data: getPaymentByIdObj
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};



// UPDATE PAYMENT
const updatePayment = async (req, res) => {
    try {

        const updatePaymentObj = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (updatePaymentObj) {
            res.status(200).json({
                success: true,
                data: updatePaymentObj
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }
    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};



// DELETE PAYMENT
const deletePayment = async (req, res) => {
    try {

        const deletePaymentObj = await Payment.findByIdAndDelete(req.params.id);

        if (deletePaymentObj) {
            res.status(200).json({
            success: true,
            message: "Payment deleted successfully",
            data: deletePaymentObj
        });
        }else{
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });

    }
};

module.exports = {
    lockPayment,
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment
}