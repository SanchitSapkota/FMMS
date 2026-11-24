
const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({

    businessName: {
        type: String,
        required: true,
        trim: true
    },

    businessType: {
        type: String,
        trim: true
    },

    address: {
        type: String,
        required: true,
        trim: true
    },

    area: {
        type: String,
        required: true,
        trim: true
    },

    contactPerson: {
        type: String,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    },

    // Registered business GPS coordinates
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
        }

    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model(
    "Business",
    businessSchema
);

