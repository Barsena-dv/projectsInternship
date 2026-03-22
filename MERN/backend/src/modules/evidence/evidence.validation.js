const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const uploadEvidenceSchema = Joi.object({
    assignmentId: Joi.string().pattern(objectIdRegex).required(),
    fileType: Joi.string().valid("image", "photo", "video").required(),
    // filePath: Joi.string().trim().required(),
    caption: Joi.string().trim().allow("", null),
});

module.exports = {
    uploadEvidenceSchema,
};
