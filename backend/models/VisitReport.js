
const mongoose = require("mongoose");

const visitReportSchema = new mongoose.Schema({

    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
        unique: true
    },

    // GPS information
    location: {
        latitude: {
            type: Number,
            min: -90,
            max: 90
        },

        longitude: {
            type: Number,
            min: -180,
            max: 180
        },

        accuracy: {
            type: Number,
            min: 0
        },

        capturedAt: {
            type: Date
        }
    },

    locationVerificationStatus: {
        type: String,
        enum: ["verified", "unverified"],
        default: "unverified"
    },

    // Business information
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },

    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    visitDate: {
        type: Date,
        default: Date.now
    },

    // Visit outcome
    outcome: {
        type: String,
        enum: [
            "interested",
            "not-interested",
            "follow-up-required",
            "not-available",
            "completed"
        ],
        required: true
    },

    remarks: {
        type: String,
        required: true,
        trim: true
    },

    // Multiple visit photographs stored in Cloudinary
    photos: [
        {
            url: {
                type: String,
                required: true
            },

            publicId: {
                type: String,
                required: true
            },

            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    // Follow-up information
    nextFollowUpDate: {
        type: Date
    },

    followUpStatus: {
        type: String,
        enum: [
            "not-required",
            "pending",
            "completed",
            "cancelled"
        ],
        default: "not-required"
    },

    followUpRemarks: {
        type: String,
        trim: true,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model(
    "VisitReport",
    visitReportSchema
);

