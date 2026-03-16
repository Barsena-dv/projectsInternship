const EvidenceFile = require("./evidence.model");

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
    createEvidenceFile,
    getAllEvidenceFiles,
    getEvidenceFileById,
    updateEvidenceFileById,
    deleteEvidenceFileById,
}