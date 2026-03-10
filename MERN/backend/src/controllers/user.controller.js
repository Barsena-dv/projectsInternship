const userSchema = require('../models/user.model');
const bcrypt = require('bcrypt');


const registerUser = async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const registerUserObj = await userSchema.create({...req.body, password: hashedPassword});
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: registerUserObj,
        })
    }catch(err){
        res.status(500).json({
            message: "Error registering user",
            err: err
        })
    }
}

module.exports = {
    registerUser,
}