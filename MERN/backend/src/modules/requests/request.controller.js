const LostItemRequest = require("./request.model");

//For creating the lost item request
const createLostItemRequest = async (req, res) => {
    try {
        const createLostItemRequestObj = await LostItemRequest.create(req.body);
        if(createLostItemRequestObj){
            return res.status(201).json({
                success: true,
                message: "Lost item request created successfully",
                data: createLostItemRequestObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Lost item request creation failed",
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

//For fetching all the lost item requests
const getAllLostItemRequests = async (req, res) => {
    try {
        const getAllLostItemRequestsObj = await LostItemRequest
        .find({requestStatus: "open"})
        .populate("ownerId", "fullName email")
        .populate("categoryId", "name")
        .populate("planId", "planName");
        if(getAllLostItemRequestsObj){
            return res.status(200).json({
                success: true,
                message: "Lost item requests fetched successfully",
                data: getAllLostItemRequestsObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Lost item requests not found",
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

//For fetching a lost item request by id
const getLostItemRequestById = async (req, res) => {
    try {
        const getLostItemRequestByIdObj = await LostItemRequest
        .findById(req.params.id)
        .populate("ownerId", "fullName email")
        .populate("categoryId", "name")
        .populate("planId", "planName");
        if(getLostItemRequestByIdObj){
            return res.status(200).json({
                success: true,
                message: "Lost item request fetched successfully",
                data: getLostItemRequestByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
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


//For updating a lost item request by id
const updateLostItemRequestById = async (req, res) => {
    try {
        const updateLostItemRequestByIdObj = await LostItemRequest
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateLostItemRequestByIdObj){
            return res.status(200).json({
                success: true,
                message: "Lost item request updated successfully",
                data: updateLostItemRequestByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
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

//For deleting a lost item request by id
const deleteLostItemRequestById = async (req, res) => {
    try {
        const deleteLostItemRequestByIdObj = await LostItemRequest.findByIdAndDelete(req.params.id);
        if(deleteLostItemRequestByIdObj){
            return res.status(200).json({
                success: true,
                message: "Lost item request deleted successfully",
                data: deleteLostItemRequestByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Lost item request not found",
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
    createLostItemRequest,
    getAllLostItemRequests,
    getLostItemRequestById,
    updateLostItemRequestById,
    deleteLostItemRequestById,
}
