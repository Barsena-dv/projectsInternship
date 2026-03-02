const bcrypt = require("bcrypt");
const User = require("../models/user.model");

// REGISTER
const register = async (req, res, next) => {
   try {
      const { name, email, phone, password } = req.body;

      if (!name || !email || !phone || !password) {
         return res.status(400).json({
            success: false,
            message: "All fields are required"
         });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({
            success: false,
            message: "Email already registered"
         });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
         name,
         email,
         phone,
         password: hashedPassword,
         role: "USER"
      });

      const safeUser = user.toObject();
      delete safeUser.password;

      res.status(201).json({
         success: true,
         message: "User registered successfully",
         user: safeUser
      });

   } catch (error) {
      next(error);
   }
};

// LOGIN (placeholder)
const jwt = require("jsonwebtoken");

const login = async (req, res, next) => {
   try {

      const { email, password } = req.body;

      if (!email || !password) {
         return res.status(400).json({
            success: false,
            message: "Email and password are required"
         });
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
         return res.status(400).json({
            success: false,
            message: "Invalid credentials"
         });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
         return res.status(400).json({
            success: false,
            message: "Invalid credentials"
         });
      }

      const token = jwt.sign(
         { id: user._id, role: user.role },
         process.env.JWT_SECRET,
         { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const safeUser = user.toObject();
      delete safeUser.password;

      res.status(200).json({
         success: true,
         message: "Login successful",
         token,
         user: safeUser
      });

   } catch (error) {
      next(error);
   }
};

// ME (placeholder)
const me = async (req, res) => {
   res.status(200).json({
      success: true,
      user: req.user
   });
};

module.exports = {
   register,
   login,
   me
};