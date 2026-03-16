const Report = require("./report.model");

//For creating the report
const createReport = async(req,res)=>{
    try {
        const createReportObj = await Report.create(req.body);
        if(createReportObj){
            res.status(201).json({
                success: true,
                message: "Report created successfully",
                data: createReportObj
            });
        }else{
            res.status(400).json({
                success: false,
                message: "Failed to create report",
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

//For getting all the reports
const getAllReports = async(req,res)=>{
    try {
        const getAllReportsObj = await Report.find()
        .populate("reportedBy", "fullName email")
        .populate("reportedUser", "fullName email")
        .populate("handledByAdmin", "fullName email")
        .populate("requestId").populate("assignmentId");
        if(getAllReportsObj){
            res.status(200).json({
                success: true,
                message: "All Reports fetched successfully",
                data: getAllReportsObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Report not found",
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

//For getting the report by id
const getReportById = async(req,res)=>{
    try {
        const getReportByIdObj = await Report.findById(req.params.id)
        .populate("reportedBy", "fullName email")
        .populate("reportedUser", "fullName email")
        .populate("handledByAdmin", "fullName email")
        .populate("requestId").populate("assignmentId");
        if(getReportByIdObj){
            res.status(200).json({
                success: true,
                message: "Report fetched successfully",
                data: getReportByIdObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Report not found",
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

//For updating the report
const updateReport = async(req,res)=>{
    try {
        const updateReportObj = await Report.findByIdAndUpdate(req.params.id,req.body,{new:true});
        if(updateReportObj){
            res.status(200).json({
                success: true,
                message: "Report updated successfully",
                data: updateReportObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Report not found",
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

//For deleting the report
const deleteReport = async(req,res)=>{
    try {
        const deleteReportObj = await Report.findByIdAndDelete(req.params.id);
        if(deleteReportObj){
            res.status(200).json({
                success: true,
                message: "Report deleted successfully",
                data: deleteReportObj
            });
        }else{
            res.status(404).json({
                success: false,
                message: "Report not found",
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
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport
}