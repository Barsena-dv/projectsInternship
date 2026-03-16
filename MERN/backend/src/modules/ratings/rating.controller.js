const Rating = require("./rating.model");

//For creating the rating
const createRating = async(req,res)=>{
    try {
        const createRatingObj = await Rating.create(req.body);
        if(createRatingObj){
            res.status(201).json({
                success: true,
                message: "Rating created successfully",
                data: createRatingObj
            });
        }else{
            res.status(400).json({
                success: false,
                message: "Failed to create rating",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For getting all the rating
const getAllRatings = async(req,res)=>{
    try {
        const getAllRatingsObj = await Rating
        .find()
        .populate("fromUserId", "fullName email")
        .populate("toUserId", "fullName email")
        .populate("requestId");
        if(getAllRatingsObj){
            res.status(200).json({
                success: true,
                message: "All Ratings fetched successfully",
                data: getAllRatingsObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For getting the rating by id
const getRatingById = async(req,res)=>{
    try {
        const getRatingObj = await Rating
        .findById(req.params.id)
        .populate("fromUserId", "fullName email")
        .populate("toUserId", "fullName email")
        .populate("requestId");
        if(getRatingObj){
            res.status(200).json({
                success: true,
                message: "Rating fetched successfully",
                data: getRatingObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For updating the rating
const updateRating = async(req,res)=>{
    try {
        const updateRatingObj = await Rating.findByIdAndUpdate(req.params.id,req.body,{new:true});
        if(updateRatingObj){
            res.status(200).json({
                success: true,
                message: "Rating updated successfully",
                data: updateRatingObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

//For deleting the rating
const deleteRating = async(req,res)=>{
    try {
        const deleteRatingObj = await Rating.findByIdAndDelete(req.params.id);
        if(deleteRatingObj){
            res.status(200).json({
                success: true,
                message: "Rating deleted successfully",
                data: deleteRatingObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Rating not found",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error:error
        });
    }
}

module.exports = {
    createRating,
    getAllRatings,
    getRatingById,
    updateRating,
    deleteRating
}
