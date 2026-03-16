const Category = require("./category.model");

//For creating the category
const createCategory = async (req, res) => {
    try {
        const createCategoryObj = await Category.create(req.body);
        if(createCategoryObj){
            return res.status(201).json({
                success: true,
                message: "Category created successfully",
                data: createCategoryObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "Category creation failed",
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

//For fetching all the categories
const getAllCategories = async (req, res) => {
    try {
        const getAllCategoriesObj = await Category.find({isActive: true});
        if(getAllCategoriesObj){
            return res.status(200).json({
                success: true,
                message: "Categories fetched successfully",
                data: getAllCategoriesObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Categories not found",
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

//For fetching a single category by id
const getCategoryById = async (req, res) => {
    try {
        const getCategoryByIdObj = await Category.findById(req.params.id);
        if(getCategoryByIdObj){
            return res.status(200).json({
                success: true,
                message: "Category fetched successfully",
                data: getCategoryByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Category not found",
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

//For updating a category by id
const updateCategoryById = async (req, res) => {
    try {
        const updateCategoryByIdObj = await Category.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateCategoryByIdObj){
            return res.status(200).json({
                success: true,
                message: "Category updated successfully",
                data: updateCategoryByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Category not found",
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


//For deleting a category by id
const deleteCategoryById = async (req, res) => {
    try {
        const deleteCategoryByIdObj = await Category.findByIdAndDelete(req.params.id);
        if(deleteCategoryByIdObj){
            return res.status(200).json({
                success: true,
                message: "Category deleted successfully",
                data: deleteCategoryByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Category not found",
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
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
}