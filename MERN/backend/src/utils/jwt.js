const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "postnfind_demo_secret";
const tokenExpiry = "170d";

const generateToken = (user) => {
	return jwt.sign(
		{
			id: String(user._id || user.id),
			role: user.role,
		},
		jwtSecret,
		{
			expiresIn: tokenExpiry,
		}
	);
};

const verifyToken = (token) => {
	return jwt.verify(token, jwtSecret);
};

module.exports = {
	generateToken,
	verifyToken,
};
