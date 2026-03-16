const Milestone = require("./milestone.model");

//For creating the milestone
const createMilestone = async (req, res) => {
    try {
        const createMilestoneObj = await Milestone.create(req.body);
        if(createMilestoneObj){
            return res.status(201).json({
                success: true,
                message: "Milestone created successfully",
                data: createMilestoneObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Milestone creation failed",
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

//For fetching all the milestones
const getAllMilestones = async (req, res) => {
    try {
        const getAllMilestonesObj = await Milestone
        .find()
        .populate("assignmentId")
        .populate("finderId", "fullName email role");
        if(getAllMilestonesObj){
            return res.status(200).json({
                success: true,
                message: "Milestones fetched successfully",
                data: getAllMilestonesObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Milestones not found",
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

//For fetching a milestone by id
const getMilestoneById = async (req, res) => {
    try {
        const getMilestoneByIdObj = await Milestone
        .findById(req.params.id)
        .populate("assignmentId")
        .populate("finderId", "fullName email role");
        if(getMilestoneByIdObj){
            return res.status(200).json({
                success: true,
                message: "Milestone fetched successfully",
                data: getMilestoneByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Milestone not found",
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

//For updating a milestone by id
const updateMilestoneById = async (req, res) => {
    try {
        const updateMilestoneByIdObj = await Milestone
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateMilestoneByIdObj){
            return res.status(200).json({
                success: true,
                message: "Milestone updated successfully",
                data: updateMilestoneByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Milestone not found",
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

//For deleting a milestone by id
const deleteMilestoneById = async (req, res) => {
    try {
        const deleteMilestoneByIdObj = await Milestone.findByIdAndDelete(req.params.id);
        if(deleteMilestoneByIdObj){
            return res.status(200).json({
                success: true,
                message: "Milestone deleted successfully",
                data: deleteMilestoneByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Milestone not found",
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
    createMilestone,
    getAllMilestones,
    getMilestoneById,
    updateMilestoneById,
    deleteMilestoneById,
}