const Payment = require("./payment.model");


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
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment
}