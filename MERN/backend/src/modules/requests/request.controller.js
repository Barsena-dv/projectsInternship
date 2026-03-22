const LostItemRequest = require("./request.model");
const Payment = require("../payments/payment.model");

const editableRequestStatuses = ["draft", "open"];
const validPaymentStatuses = new Set(["unpaid", "locked", "released", "refunded"]);

const assignmentPopulateConfig = {
    path: "assignmentId",
    populate: {
        path: "finderId",
        select: "fullName profileImage",
    },
};

const normalizePaymentStatus = (paymentStatus) => {
    if (!paymentStatus || !validPaymentStatuses.has(paymentStatus)) {
        return "unpaid";
    }

    return paymentStatus;
};

const formatRequestForFrontend = (request, paymentStatus = "unpaid") => {
    const assignmentValue = request.assignmentId || null;
    const isPopulatedAssignment =
        assignmentValue && typeof assignmentValue === "object" && assignmentValue._id;

    const assignment = assignmentValue
        ? {
            _id: isPopulatedAssignment ? assignmentValue._id : assignmentValue,
            status: isPopulatedAssignment ? assignmentValue.assignmentStatus : null,
            evidenceSubmitted: isPopulatedAssignment
                ? Boolean(assignmentValue.evidenceSubmitted)
                : false,
            finder: {
                name:
                    isPopulatedAssignment &&
                    assignmentValue.finderId &&
                    typeof assignmentValue.finderId === "object"
                        ? assignmentValue.finderId.fullName || null
                        : null,
                profileImage:
                    isPopulatedAssignment &&
                    assignmentValue.finderId &&
                    typeof assignmentValue.finderId === "object"
                        ? assignmentValue.finderId.profileImage || null
                        : null,
            },
        }
        : null;

    return {
        _id: request._id,
        itemName: request.itemName,
        requestStatus: request.requestStatus,
        paymentStatus: normalizePaymentStatus(paymentStatus),
        createdAt: request.createdAt,
        assignment,
    };
};

const getPaymentStatusMapByRequestIds = async (requestIds, ownerId) => {
    const paymentStatusMap = new Map();

    if (!requestIds.length) {
        return paymentStatusMap;
    }

    const paymentQuery = {
        requestId: { $in: requestIds },
    };

    if (ownerId) {
        paymentQuery.ownerId = ownerId;
    }

    const payments = await Payment.find(paymentQuery)
        .select("requestId paymentStatus createdAt")
        .sort({ createdAt: -1 });

    for (const payment of payments) {
        const key = payment.requestId.toString();
        if (!paymentStatusMap.has(key)) {
            paymentStatusMap.set(key, normalizePaymentStatus(payment.paymentStatus));
        }
    }

    return paymentStatusMap;
};

const getLatestPaymentStatusForRequest = async (requestId, ownerId) => {
    const paymentQuery = { requestId };
    if (ownerId) {
        paymentQuery.ownerId = ownerId;
    }

    const payment = await Payment.findOne(paymentQuery)
        .select("paymentStatus")
        .sort({ createdAt: -1 });

    return payment ? normalizePaymentStatus(payment.paymentStatus) : "unpaid";
};

// For creating the lost item request
const createLostItemRequest = async (req, res) => {
    try {
        const createdRequest = await LostItemRequest.create(req.body);
        const populatedRequest = await LostItemRequest.findById(createdRequest._id)
            .populate(assignmentPopulateConfig);

        return res.status(201).json({
            success: true,
            data: formatRequestForFrontend(populatedRequest || createdRequest, "unpaid"),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const createRequest = async (req, res) => {
    try {
        const createdRequest = await LostItemRequest.create({
            ...req.body,
            ownerId: req.user.id,
            requestStatus: "draft",
        });

        const populatedRequest = await LostItemRequest.findById(createdRequest._id)
            .populate(assignmentPopulateConfig);

        return res.status(201).json({
            success: true,
            data: formatRequestForFrontend(populatedRequest || createdRequest, "unpaid"),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const getOwnerRequests = async (req, res) => {
    try {
        const requests = await LostItemRequest.find({ ownerId: req.user.id })
            .populate(assignmentPopulateConfig)
            .sort({ createdAt: -1 });

        const paymentStatusMap = await getPaymentStatusMapByRequestIds(
            requests.map((request) => request._id),
            req.user.id
        );

        const formattedRequests = requests.map((request) =>
            formatRequestForFrontend(
                request,
                paymentStatusMap.get(request._id.toString()) || "unpaid"
            )
        );

        return res.status(200).json({
            success: true,
            data: {
                requests: formattedRequests,
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

const updateRequest = async (req, res) => {
    try {
        const existingRequest = await LostItemRequest.findById(req.params.id);

        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (existingRequest.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only owner can update this request",
            });
        }

        if (!editableRequestStatuses.includes(existingRequest.requestStatus)) {
            return res.status(400).json({
                success: false,
                message: "Request can only be edited in draft or open status",
            });
        }

        const updatePayload = { ...req.body };
        delete updatePayload.ownerId;
        delete updatePayload.requestStatus;

        const updatedRequest = await LostItemRequest.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        ).populate(assignmentPopulateConfig);

        const paymentStatus = await getLatestPaymentStatusForRequest(
            updatedRequest._id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: formatRequestForFrontend(updatedRequest, paymentStatus),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const publishRequest = async (req, res) => {
    try {
        const existingRequest = await LostItemRequest.findById(req.params.id)
            .populate(assignmentPopulateConfig);

        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (existingRequest.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only owner can publish this request",
            });
        }

        if (existingRequest.requestStatus !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Only draft request can be published",
            });
        }

        const payment = await Payment.findOne({
            requestId: existingRequest._id,
            ownerId: req.user.id,
            paymentStatus: { $in: ["locked", "released"] },
        }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(400).json({
                success: false,
                message: "Payment must be completed before publishing request",
            });
        }

        existingRequest.requestStatus = "open";
        await existingRequest.save();

        return res.status(200).json({
            success: true,
            data: formatRequestForFrontend(existingRequest, payment.paymentStatus),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const getOpenRequests = async (req, res) => {
    try {
        const openRequests = await LostItemRequest.find({ requestStatus: "open" })
            .populate(assignmentPopulateConfig)
            .sort({ createdAt: -1 });

        const paymentStatusMap = await getPaymentStatusMapByRequestIds(
            openRequests.map((request) => request._id)
        );

        const formattedRequests = openRequests.map((request) =>
            formatRequestForFrontend(
                request,
                paymentStatusMap.get(request._id.toString()) || "unpaid"
            )
        );

        return res.status(200).json({
            success: true,
            data: {
                requests: formattedRequests,
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

// For fetching all the lost item requests
const getAllLostItemRequests = async (req, res) => {
    try {
        const requests = await LostItemRequest.find({ requestStatus: "open" })
            .populate(assignmentPopulateConfig)
            .sort({ createdAt: -1 });

        const paymentStatusMap = await getPaymentStatusMapByRequestIds(
            requests.map((request) => request._id)
        );

        const formattedRequests = requests.map((request) =>
            formatRequestForFrontend(
                request,
                paymentStatusMap.get(request._id.toString()) || "unpaid"
            )
        );

        return res.status(200).json({
            success: true,
            data: {
                requests: formattedRequests,
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

// For fetching a lost item request by id
const getLostItemRequestById = async (req, res) => {
    try {
        const request = await LostItemRequest.findById(req.params.id)
            .populate(assignmentPopulateConfig);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
            });
        }

        const paymentStatus = await getLatestPaymentStatusForRequest(
            request._id,
            request.ownerId
        );

        return res.status(200).json({
            success: true,
            data: formatRequestForFrontend(request, paymentStatus),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

// For updating a lost item request by id
const updateLostItemRequestById = async (req, res) => {
    try {
        const updatedRequest = await LostItemRequest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate(assignmentPopulateConfig);

        if (!updatedRequest) {
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
            });
        }

        const paymentStatus = await getLatestPaymentStatusForRequest(
            updatedRequest._id,
            updatedRequest.ownerId
        );

        return res.status(200).json({
            success: true,
            data: formatRequestForFrontend(updatedRequest, paymentStatus),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

// For deleting a lost item request by id
const deleteLostItemRequestById = async (req, res) => {
    try {
        const request = await LostItemRequest.findById(req.params.id)
            .populate(assignmentPopulateConfig);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
            });
        }

        await LostItemRequest.findByIdAndDelete(req.params.id);

        const paymentStatus = await getLatestPaymentStatusForRequest(
            request._id,
            request.ownerId
        );

        return res.status(200).json({
            success: true,
            data: formatRequestForFrontend(request, paymentStatus),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

module.exports = {
    createLostItemRequest,
    createRequest,
    getOwnerRequests,
    updateRequest,
    publishRequest,
    getOpenRequests,
    getAllLostItemRequests,
    getLostItemRequestById,
    updateLostItemRequestById,
    deleteLostItemRequestById,
};