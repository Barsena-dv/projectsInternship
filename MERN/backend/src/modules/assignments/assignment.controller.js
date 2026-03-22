const FinderAssignment = require("./assignment.model");
const LostItemRequest = require("../requests/request.model");
const Payment = require("../payments/payment.model");
const Payout = require("../payouts/payout.model");
const ServicePlan = require("../servicePlans/servicePlan.model");

const normalizeDecision = (decision) => {
    const normalized = String(decision || "").toLowerCase();
    if (["confirmed", "accept", "accepted"].includes(normalized)) {
        return "accepted";
    }
    if (["rejected", "reject"].includes(normalized)) {
        return "rejected";
    }
    return null;
};

const acceptAssignment = async (req, res) => {
    try {
        const { requestId } = req.params;

        const foundRequest = await LostItemRequest.findById(requestId);
        if (!foundRequest) {
            console.error("Request not found for ID:", requestId);
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (foundRequest.requestStatus !== "open") {
            return res.status(400).json({
                success: false,
                message: "Only open request can be accepted",
            });
        }

        if (foundRequest.assignmentId) {
            return res.status(409).json({
                success: false,
                message: "Request is already assigned",
            });
        }

        const existingAssignment = await FinderAssignment.findOne({
            requestId,
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "Assignment already exists for this request",
                data: existingAssignment,
            });
        }

        const assignment = await FinderAssignment.create({
            requestId,
            finderId: req.user.id,
            assignedBy: "system",
            assignmentStatus: "accepted",
        });

        foundRequest.assignmentId = assignment._id;
        foundRequest.requestStatus = "assigned";
        await foundRequest.save();

        return res.status(201).json({
            success: true,
            message: "Assignment accepted successfully",
            data: assignment,
        });
    } catch (error) {
        console.error("Error accepting assignment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error:error,
        });
    }
};

const ownerReviewEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const normalizedDecision = normalizeDecision(req.body.decision);

        if (!normalizedDecision) {
            return res.status(400).json({
                success: false,
                message: "Decision must be accepted or rejected",
            });
        }

        const assignment = await FinderAssignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        const request = await LostItemRequest
            .findById(assignment.requestId)
            .select("ownerId planId requestStatus");
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Related request not found",
            });
        }

        if (request.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only request owner can review evidence",
            });
        }

        if (request.requestStatus !== "found") {
            return res.status(400).json({
                success: false,
                message: "Request is not ready for owner evidence review",
            });
        }

        if (assignment.assignmentStatus !== "evidence_submitted") {
            return res.status(400).json({
                success: false,
                message: "Evidence review is only allowed after evidence submission",
            });
        }

        if (normalizedDecision === "accepted") {
            const payment = await Payment
                .findOne({ requestId: assignment.requestId })
                .sort({ createdAt: -1 });

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found for this request",
                });
            }

            if (payment.paymentStatus === "refunded") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot release a refunded payment",
                });
            }

            if (payment.paymentStatus !== "released") {
                payment.paymentStatus = "released";
                await payment.save();
            }

            let finderPercent = 80;
            const planId = payment.planId || request.planId;

            if (planId) {
                const plan = await ServicePlan.findById(planId).select("finderPercent");
                if (plan && Number.isFinite(plan.finderPercent)) {
                    finderPercent = plan.finderPercent;
                }
            }

            const payoutAmount = Number(((payment.amount * finderPercent) / 100).toFixed(2));

            const existingPayout = await Payout.findOne({
                paymentId: payment._id,
                assignmentId: assignment._id,
            });

            if (!existingPayout) {
                await Payout.create({
                    paymentId: payment._id,
                    assignmentId: assignment._id,
                    finderId: assignment.finderId,
                    payoutAmount,
                    payoutStatus: "pending",
                });
            }

            assignment.ownerConfirmation = "confirmed";
            assignment.assignmentStatus = "completed";
            assignment.completedAt = new Date();
            request.requestStatus = "completed";
        }

        if (normalizedDecision === "rejected") {
            assignment.ownerConfirmation = "rejected";
            assignment.assignmentStatus = "rejected";
            assignment.evidenceSubmitted = false;
            assignment.evidenceSubmittedAt = null;
            assignment.completedAt = null;
            request.requestStatus = "assigned";
        }

        await Promise.all([assignment.save(), request.save()]);

        return res.status(200).json({
            success: true,
            message: "Evidence reviewed successfully",
            data: {
                assignment,
                request,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const confirmAssignmentByOwner = ownerReviewEvidence;

//For creating the finder assignment
const createFinderAssignment = async (req, res) => {
    try {
        const createFinderAssignmentObj = await FinderAssignment.create(req.body);
        if(createFinderAssignmentObj){
            return res.status(201).json({
                success: true,
                message: "Finder assignment created successfully",
                data: createFinderAssignmentObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Finder assignment creation failed",
            });
        }      
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

//For fetching all the finder assignments
const getAllFinderAssignments = async (req, res) => {
    try {
        const getAllFinderAssignmentsObj = await FinderAssignment
        .find()
        .populate("finderId", "fullName email role")
        .populate("requestId");
        if(getAllFinderAssignmentsObj){
            return res.status(200).json({
                success: true,
                message: "Finder assignments fetched successfully",
                data: getAllFinderAssignmentsObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder assignments not found",
            });
        }      
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

//For fetching a finder assignment by id
const getFinderAssignmentById = async (req, res) => {
    try {
        const getFinderAssignmentByIdObj = await FinderAssignment
        .findById(req.params.id)
        .populate("finderId", "fullName email role")
        .populate("requestId");
        if(getFinderAssignmentByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder assignment fetched successfully",
                data: getFinderAssignmentByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder assignment not found",
            });
        }      
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

//For updating a finder assignment by id
const updateFinderAssignmentById = async (req, res) => {
    try {
        const updateFinderAssignmentByIdObj = await FinderAssignment
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateFinderAssignmentByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder assignment updated successfully",
                data: updateFinderAssignmentByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder assignment not found",
            });
        }      
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

//For deleting a finder assignment by id
const deleteFinderAssignmentById = async (req, res) => {
    try {
        const deleteFinderAssignmentByIdObj = await FinderAssignment.findByIdAndDelete(req.params.id);
        if(deleteFinderAssignmentByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder assignment deleted successfully",
                data: deleteFinderAssignmentByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder assignment not found",
            });
        }      
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
}

module.exports = {
    acceptAssignment,
    ownerReviewEvidence,
    confirmAssignmentByOwner,
    createFinderAssignment,
    getAllFinderAssignments,
    getFinderAssignmentById,
    updateFinderAssignmentById,
    deleteFinderAssignmentById,
}
