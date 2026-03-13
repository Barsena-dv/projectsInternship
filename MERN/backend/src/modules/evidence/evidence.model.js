const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinderAssignment",
            required: true,
        },
        uploaderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fileType: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        fileCaption: {
            type: String,
            trim: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("EvidenceFile", evidenceSchema);
