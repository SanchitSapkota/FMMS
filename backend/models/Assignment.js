const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
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

        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "in-progress",
                "completed"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

// Improves searches for assignments by business and representative.
assignmentSchema.index({
    business: 1,
    representative: 1,
    status: 1
});

module.exports = mongoose.model(
    "Assignment",
    assignmentSchema
);
