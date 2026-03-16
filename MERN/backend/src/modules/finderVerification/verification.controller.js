const FinderVerification = require('./verification.model');

//For creating the finder verification
const createFinderVerification = async (req, res) => {
    try {
        const createFinderVerificationObj = await FinderVerification.create(req.body);
        if(createFinderVerificationObj){
            return res.status(201).json({
                success: true,
                message: "Finder verification created successfully",
                data: createFinderVerificationObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Finder verification creation failed",
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

//For fetching all the finder verifications
const getAllFinderVerifications = async (req, res) => {
    try {
        const getAllFinderVerificationsObj = await FinderVerification
        .find()
        .populate("finderId","fullName email role")
        .populate("verifiedByAdmin","fullName email");
        if(getAllFinderVerificationsObj){
            return res.status(200).json({
                success: true,
                message: "Finder verifications fetched successfully",
                data: getAllFinderVerificationsObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder verifications not found",
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

//For fetching a finder verification by id
const getFinderVerificationById = async (req, res) => {
    try {
        const getFinderVerificationByIdObj = await FinderVerification
        .findById(req.params.id)
        .populate("finderId","fullName email role")
        .populate("verifiedByAdmin","fullName email");
        if(getFinderVerificationByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder verification fetched successfully",
                data: getFinderVerificationByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder verification not found",
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

//For updating a finder verification by id
const updateFinderVerificationById = async (req, res) => {
    try {
        const updateFinderVerificationByIdObj = await FinderVerification
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateFinderVerificationByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder verification updated successfully",
                data: updateFinderVerificationByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder verification not found",
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

//For deleting a finder verification by id
const deleteFinderVerificationById = async (req, res) => {
    try {
        const deleteFinderVerificationByIdObj = await FinderVerification.findByIdAndDelete(req.params.id);
        if(deleteFinderVerificationByIdObj){
            return res.status(200).json({
                success: true,
                message: "Finder verification deleted successfully",
                data: deleteFinderVerificationByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Finder verification not found",
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
    createFinderVerification,
    getAllFinderVerifications,
    getFinderVerificationById,
    updateFinderVerificationById,
    deleteFinderVerificationById,
}
