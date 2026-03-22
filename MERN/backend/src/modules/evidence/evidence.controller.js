const EvidenceFile = require("./evidence.model");
const mongoose = require("mongoose");

const FinderAssignment = require("../assignments/assignment.model");
const LostItemRequest = require("../requests/request.model");

const uploadEvidence = async (req, res) => {
    try {
        const { assignmentId, caption, fileType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment id",
            });
        }

        const assignment = await FinderAssignment.findById(assignmentId);

        const uploadedFiles = [];
        if (Array.isArray(req.files) && req.files.length) {
            uploadedFiles.push(...req.files);
        }
        if (req.file) {
            uploadedFiles.push(req.file);
        }

        if (!uploadedFiles.length) {
            return res.status(400).json({
                success: false,
                message: "Evidence file is required",
            });
        }

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (assignment.finderId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Only assigned finder can upload evidence",
            });
        }

        if (assignment.evidenceSubmitted) {
            return res.status(400).json({
                success: false,
                message: "Evidence already submitted",
            });
        }

        if (!["accepted", "rejected"].includes(assignment.assignmentStatus)) {
            return res.status(400).json({
                success: false,
                message: "Evidence upload is not allowed in current assignment state",
            });
        }

        const request = await LostItemRequest.findById(assignment.requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Related request not found",
            });
        }

        if (request.requestStatus !== "assigned") {
            return res.status(400).json({
                success: false,
                message: "Evidence can only be submitted for assigned requests",
            });
        }

        const normalizedInputType = String(fileType || "").toLowerCase();
        const normalizedFileType = ["image", "photo"].includes(normalizedInputType)
            ? "photo"
            : normalizedInputType === "video"
            ? "video"
            : null;

        if (!normalizedFileType) {
            return res.status(400).json({
                success: false,
                message: "fileType must be image or video",
            });
        }

        if (normalizedFileType === "photo" && uploadedFiles.length > 6) {
            return res.status(400).json({
                success: false,
                message: "Maximum 6 image files are allowed",
            });
        }

        if (normalizedFileType === "video" && uploadedFiles.length !== 1) {
            return res.status(400).json({
                success: false,
                message: "Only 1 video file is allowed",
            });
        }

        const hasInvalidMimeType = uploadedFiles.some((file) => {
            const mimeType = file.mimetype || "";
            return normalizedFileType === "photo"
                ? !mimeType.startsWith("image/")
                : !mimeType.startsWith("video/");
        });

        if (hasInvalidMimeType) {
            return res.status(400).json({
                success: false,
                message: "Uploaded files do not match selected fileType",
            });
        }

        const evidencePayload = uploadedFiles.map((file) => ({
            assignmentId,
            uploaderId: req.user.id,
            fileType: normalizedFileType,
            filePath: file.path,
            caption,
        }));

        const evidence = await EvidenceFile.insertMany(evidencePayload);

        assignment.evidenceSubmitted = true;
        assignment.evidenceSubmittedAt = new Date();
        assignment.assignmentStatus = "evidence_submitted";

        request.requestStatus = "found";

        await Promise.all([assignment.save(), request.save()]);

        return res.status(201).json({
            success: true,
            message: "Evidence uploaded successfully",
            data: evidence,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

const getEvidenceForOwner = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment id",
            });
        }

        const assignment = await FinderAssignment
            .findById(assignmentId)
            .populate("requestId", "ownerId");

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (
            !assignment.requestId ||
            assignment.requestId.ownerId.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "Only request owner can view evidence",
            });
        }

        const evidenceFiles = await EvidenceFile
            .find({ assignmentId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Evidence files fetched successfully",
            data: evidenceFiles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

//For creating the evidence file
const createEvidenceFile = async (req, res) => {
    try {
        const createEvidenceFileObj = await EvidenceFile.create(req.body);
        if(createEvidenceFileObj){
            return res.status(201).json({
                success: true,
                message: "Evidence file created successfully",
                data: createEvidenceFileObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Evidence file creation failed",
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

//For fetching all the evidence files
const getAllEvidenceFiles = async (req, res) => {
    try {
        const getAllEvidenceFilesObj = await EvidenceFile
        .find()
        .populate("assignmentId")
        .populate("uploaderId", "fullName email role");
        if(getAllEvidenceFilesObj){
            return res.status(200).json({
                success: true,
                message: "Evidence files fetched successfully",
                data: getAllEvidenceFilesObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Evidence files not found",
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

//For fetching a evidence file by id
const getEvidenceFileById = async (req, res) => {
    try {
        const getEvidenceFileByIdObj = await EvidenceFile
        .findById(req.params.id)
        .populate("assignmentId")
        .populate("uploaderId", "fullName email role");
        if(getEvidenceFileByIdObj){
            return res.status(200).json({
                success: true,
                message: "Evidence file fetched successfully",
                data: getEvidenceFileByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Evidence file not found",
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

//For updating a evidence file by id
const updateEvidenceFileById = async (req, res) => {
    try {
        const updateEvidenceFileByIdObj = await EvidenceFile
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateEvidenceFileByIdObj){
            return res.status(200).json({
                success: true,
                message: "Evidence file updated successfully",
                data: updateEvidenceFileByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Evidence file not found",
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

//For deleting a evidence file by id
const deleteEvidenceFileById = async (req, res) => {
    try {
        const deleteEvidenceFileByIdObj = await EvidenceFile.findByIdAndDelete(req.params.id);
        if(deleteEvidenceFileByIdObj){
            return res.status(200).json({
                success: true,
                message: "Evidence file deleted successfully",
                data: deleteEvidenceFileByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Evidence file not found",
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
    uploadEvidence,
    getEvidenceForOwner,
    createEvidenceFile,
    getAllEvidenceFiles,
    getEvidenceFileById,
    updateEvidenceFileById,
    deleteEvidenceFileById,
}