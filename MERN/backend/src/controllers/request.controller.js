const Request = require("../models/request.model");

exports.createRequest = async (req, res, next) => {
    try {

        const ownerId = req.user._id;

        const {
            title,
            category,
            description,
            lostDate,
            generalLocation,
            exactLocation,
            rewardAmount,
        } = req.body;
        const coordinates = typeof req.body.coordinates === "string"
            ? JSON.parse(req.body.coordinates)
            : req.body.coordinates;
        const imagePaths = req.files ? req.files.map(file => file.path) : [];

        const request = await Request.create({
            ownerId,
            title,
            category,
            description,
            lostDate,
            generalLocation,
            exactLocation,
            rewardAmount,
            images: imagePaths,
            location: {
                type: "Point",
                coordinates: coordinates
            }
        });

        res.status(201).json({
            success: true,
            message: "Request created successfully",
            data: request
        });

    } catch (error) {
        next(error);
    }
};

exports.getMyRequests = async (req, res, next) => {
    try {

        const requests = await Request.find({
            ownerId: req.user._id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        next(error);
    }
};

exports.getNearbyRequests = async (req, res, next) => {
    try {

        const { lat, lng } = req.query;

        const requests = await Request.find({
            status: "OPEN",
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 10000
                }
            }
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        next(error);
    }
};

exports.getRequestById = async (req, res, next) => {
    try {

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update a request (owner only)
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequest = async (req, res, next) => {
    try {

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        // Ownership check
        if (request.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Only allow safe fields to be updated
        const allowedFields = [
            "title", "category", "description",
            "lostDate", "generalLocation", "exactLocation", "rewardAmount"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                request[field] = req.body[field];
            }
        });

        const updated = await request.save();

        res.json({
            success: true,
            message: "Request updated successfully",
            data: updated
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete a request (owner only)
// @route   DELETE /api/requests/:id
// @access  Private
exports.deleteRequest = async (req, res, next) => {
    try {

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        // Ownership check
        if (request.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        await request.deleteOne();

        res.json({
            success: true,
            message: "Request deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update request status (DRAFT → OPEN)
// @route   PATCH /api/requests/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res, next) => {
    try {

        const { status } = req.body;

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        // Ownership check
        if (request.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Enforce valid status transition: DRAFT → OPEN
        const validTransitions = {
            DRAFT: ["OPEN"],
        };

        const allowed = validTransitions[request.status];
        if (!allowed || !allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${request.status} to ${status}`
            });
        }

        request.status = status;
        const updated = await request.save();

        res.json({
            success: true,
            message: `Request status updated to ${status}`,
            data: updated
        });

    } catch (error) {
        next(error);
    }
};
