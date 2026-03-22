const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const locationSchema = Joi.object({
	type: Joi.string().valid("Point").default("Point"),
	coordinates: Joi.array().items(Joi.number().required()).length(2).required(),
});

const createRequestSchema = Joi.object({
	ownerId: Joi.string().pattern(objectIdRegex),
	planId: Joi.string().pattern(objectIdRegex).required(),
	categoryId: Joi.string().pattern(objectIdRegex).required(),
	itemName: Joi.string().trim().required(),
	description: Joi.string().trim().required(),
	brand: Joi.string().trim().allow("", null),
	model: Joi.string().trim().allow("", null),
	color: Joi.string().trim().allow("", null),
	serialNumber: Joi.string().trim().allow("", null),
	uniqueIdentifiers: Joi.string().trim().allow("", null),
	rewardAmount: Joi.number().min(0),
	lastSeenLocation: Joi.string().trim().required(),
	location: locationSchema.required(),
	lastSeenDatetime: Joi.date().required(),
	serviceDeadline: Joi.date().required(),
	images: Joi.array().items(Joi.string()),
});

const updateRequestSchema = Joi.object({
	planId: Joi.string().pattern(objectIdRegex),
	categoryId: Joi.string().pattern(objectIdRegex),
	itemName: Joi.string().trim(),
	description: Joi.string().trim(),
	brand: Joi.string().trim().allow("", null),
	model: Joi.string().trim().allow("", null),
	color: Joi.string().trim().allow("", null),
	serialNumber: Joi.string().trim().allow("", null),
	uniqueIdentifiers: Joi.string().trim().allow("", null),
	rewardAmount: Joi.number().min(0),
	lastSeenLocation: Joi.string().trim(),
	location: locationSchema,
	lastSeenDatetime: Joi.date(),
	serviceDeadline: Joi.date(),
	images: Joi.array().items(Joi.string()),
}).min(1);

module.exports = {
	createRequestSchema,
	updateRequestSchema,
};
