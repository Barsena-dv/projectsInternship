const bcrypt = require("bcryptjs");
const User = require("../users/user.model");
const { generateToken } = require("../../utils/jwt");
const sendMail = require('../../utils/mail.utils')

const register = async (req, res) => {
	try {
		const { email, phone, password } = req.body;

		const existingUser = await User.findOne({
			$or: [{ email }, { phone }],
		});

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "User with email or phone already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const createdUser = await User.create({
			...req.body,
			password: hashedPassword,
		});

        await sendMail(
                    createdUser.email,
                    "Welcome to PostNFind",
                    createdUser.fullName,
                    "Thank you for registering with PostNFind.",
                    `${process.env.FRONTEND_URI}/`
                );

		const token = generateToken(createdUser);
		const userData = createdUser.toObject();
		delete userData.password;

		return res.status(201).json({
			success: true,
			message: "User registered successfully",
			token,
			data: userData,
		});
	} catch (error) {
        console.log("Error in registration:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error:error,
		});
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const foundUser = await User.findOne({ email }).select("+password");;
		if (!foundUser) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const isPasswordValid = await bcrypt.compare(password, foundUser.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const token = generateToken(foundUser);
		const userData = foundUser.toObject();
		delete userData.password;

		return res.status(200).json({
			success: true,
			message: "User logged in successfully",
			token,
			data: userData,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error:error,
		});
	}
};

module.exports = {
	register,
	login,
};
