const Joi = require("joi");

const registerSchema = Joi.object({
	fullName: Joi.string().trim().required(),
	email: Joi.string().email().trim().lowercase().required(),
	phone: Joi.string().trim().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid("owner", "finder", "admin").required(),
	profileImage: Joi.string().allow(null, ""),
});

const loginSchema = Joi.object({
	email: Joi.string().email().trim().lowercase().required(),
	password: Joi.string().required(),
});

module.exports = {
	registerSchema,
	loginSchema,
};
