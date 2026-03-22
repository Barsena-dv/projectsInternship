const { verifyToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "Authorization token is missing",
			});
		}

		const token = authHeader.split(" ")[1];
		const decoded = verifyToken(token);

		req.user = {
			id: decoded.id,
			role: decoded.role,
		};

		return next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

module.exports = authMiddleware;
