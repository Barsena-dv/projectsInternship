const FinderAssignment = require("./assignment.model");

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
    createFinderAssignment,
    getAllFinderAssignments,
    getFinderAssignmentById,
    updateFinderAssignmentById,
    deleteFinderAssignmentById,
}
