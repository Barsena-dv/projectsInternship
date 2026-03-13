const userSchema = require('./user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();
const sendMail = require('../../utils/mail.utils')
const path = require("path")


const registerUser = async (req, res) => {
    try {
        console.log("REGISTER API HIT");

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const registerUserObj = await userSchema.create({ ...req.body, password: hashedPassword });

        console.log("USER CREATED:", registerUserObj.email);

        await sendMail(
            registerUserObj.email,
            "Welcome to PostNFind",
            registerUserObj.fullName,
            "Thank you for registering with PostNFind.",
            `${process.env.FRONTEND_URI}/`
        );

        console.log("MAIL FUNCTION CALLED");

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: registerUserObj,
        })
    } catch (err) {
        res.status(500).json({
            message: "Error registering user",
            err: err
        })
    }
}

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const foundUserFromEmail = await userSchema.findOne({ email: email });
        if (foundUserFromEmail) {
            const isPasswordValid = await bcrypt.compare(password, foundUserFromEmail.password);
            if (isPasswordValid) {
                res.status(200).json({
                    success: true,
                    message: "User logged in successfully",
                    data: foundUserFromEmail,
                    role: foundUserFromEmail.role,
                })
            } else {
                res.status(401).json({
                    success: false,
                    message: "Invalid password",
                })
            }
        } else {
            res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
    } catch (err) {
        res.status(500).json({
            message: "Error logging in user",
            err: err
        })
    }
}

module.exports = {
    registerUser,
    userLogin,
}