const userSchema = require('./user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();
const sendMail = require('../../utils/mail.utils')
const path = require("path")


// const registerUser = async (req, res) => {
//     try {
//         console.log("REGISTER API HIT");

//         const hashedPassword = await bcrypt.hash(req.body.password, 10);

//         const registerUserObj = await userSchema.create({ ...req.body, password: hashedPassword });

//         console.log("USER CREATED:", registerUserObj.email);

//         await sendMail(
//             registerUserObj.email,
//             "Welcome to PostNFind",
//             registerUserObj.fullName,
//             "Thank you for registering with PostNFind.",
//             `${process.env.FRONTEND_URI}/`
//         );

//         console.log("MAIL FUNCTION CALLED");

//         res.status(201).json({
//             success: true,
//             message: "User registered successfully",
//             data: registerUserObj,
//         })
//     } catch (err) {
//         res.status(500).json({
//             message: "Error registering user",
//             err: err
//         })
//     }
// }

// const userLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const foundUserFromEmail = await userSchema.findOne({ email: email });
//         if (foundUserFromEmail) {
//             const isPasswordValid = await bcrypt.compare(password, foundUserFromEmail.password);
//             if (isPasswordValid) {
//                 res.status(200).json({
//                     success: true,
//                     message: "User logged in successfully",
//                     data: foundUserFromEmail,
//                     role: foundUserFromEmail.role,
//                 })
//             } else {
//                 res.status(401).json({
//                     success: false,
//                     message: "Invalid password",
//                 })
//             }
//         } else {
//             res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             })
//         }
//     } catch (err) {
//         res.status(500).json({
//             message: "Error logging in user",
//             err: err
//         })
//     }
// }

//For creating the user from the backend side(only for the admin to access)
const createUser = async (req, res) => {
    try {
        const createUserObj = await userSchema.create(req.body);
        if(createUserObj){
            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: createUserObj,
            });
        }else{
            return res.status(400).json({
                success: false,
                message: "User creation failed",
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

//For fetching all the users(only for the admin to access)
const getAllUsers = async (req, res) => {
    try {
        const getAllUsersObj = await userSchema.find();
        if(getAllUsersObj){
            return res.status(200).json({
                success: true,
                message: "Users fetched successfully",
                data: getAllUsersObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "Users not found",
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

//For fetching a user by id(only for the admin to access)
const getUserById = async (req, res) => {
    try {
        const getUserByIdObj = await userSchema.findById(req.params.id);
        if(getUserByIdObj){
            return res.status(200).json({
                success: true,
                message: "User fetched successfully",
                data: getUserByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "User not found",
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

//For updating a user by id(the user can only update their own profile except the admin)
const updateUserById = async (req, res) => {
    try {
        const updateUserByIdObj = await userSchema
        .findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(updateUserByIdObj){
            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updateUserByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "User not found",
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

//For deleting a user by id(only for the admin to access)
const deleteUserById = async (req, res) => {
    try {
        const deleteUserByIdObj = await userSchema
        .findByIdAndDelete(req.params.id);
        if(deleteUserByIdObj){
            return res.status(200).json({
                success: true,
                message: "User deleted successfully",
                data: deleteUserByIdObj,
            });
        }else{
            return res.status(404).json({
                success: false,
                message: "User not found",
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
    createUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
}