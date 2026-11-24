require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Business = require("./models/Business");
const Assignment = require("./models/Assignment");
const VisitReport = require("./models/VisitReport");

const upload = require("./middleware/uploadMiddleware");
const uploadToCloudinary = require("./utils/cloudinaryUpload");
const cloudinary = require("./config/cloudinary");

const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const calculateDistance = require("./utils/gpsUtils");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/FMMS";


// Nepal date boundary (UTC+05:45)
function nepalDateBoundary(value, endOfDay = false) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);

    const check = new Date(Date.UTC(year, month - 1, day));

    if (
        check.getUTCFullYear() !== year ||
        check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day
    ) {
        return null;
    }

    const suffix = endOfDay
        ? "T23:59:59.999+05:45"
        : "T00:00:00.000+05:45";

    return new Date(`${value}${suffix}`);
}

function getNepalDate() {

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function addDateRange(
    filter,
    startDate,
    endDate,
    field = "visitDate"
) {

    if (!startDate && !endDate) return null;

    const range = {};

    if (startDate) {

        range.$gte = nepalDateBoundary(startDate);

        if (!range.$gte) {
            return "Invalid start date. Use YYYY-MM-DD.";
        }
    }

    if (endDate) {

        range.$lte = nepalDateBoundary(endDate, true);

        if (!range.$lte) {
            return "Invalid end date. Use YYYY-MM-DD.";
        }
    }

    if (
        range.$gte &&
        range.$lte &&
        range.$gte > range.$lte
    ) {
        return "Start date cannot be after end date.";
    }

    filter[field] = range;

    return null;
}

function validId(id) {

    return mongoose.isObjectIdOrHexString(id);
}

function escapeRegex(value) {

    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

async function getManagerRepresentativeIds(managerId) {

    const representatives = await User.find({
        role: "representative",
        manager: managerId
    }).select("_id");

    return representatives.map(rep => rep._id);
}

// Validate registered business GPS coordinates.
function validateBusinessLocation(location) {

    if (location === null) {
        return {
            valid: true,
            value: undefined,
            clear: true
        };
    }

    if (typeof location === "string") {

        try {
            location = JSON.parse(location);
        } catch {
            return {
                valid: false,
                message: "Invalid GPS location format."
            };
        }
    }

    if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location)
    ) {
        return {
            valid: false,
            message: "Location must contain latitude and longitude."
        };
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return {
            valid: false,
            message: "Invalid latitude or longitude."
        };
    }

    return {
        valid: true,
        value: {
            latitude,
            longitude
        }
    };
}


app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Welcome to FMMS Backend"
    });

});

app.get("/api/health", (req, res) => {

    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        message: connected
            ? "FMMS Server is healthy"
            : "MongoDB is not connected"
    });

});


app.post("/login", async (req, res) => {

    try {

        const email = String(
            req.body.email || ""
        ).trim().toLowerCase();

        const password = req.body.password;

        if (
            !email ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email });

        if (
            !user ||
            !(await bcrypt.compare(password, user.password))
        ) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {

            return res.status(500).json({
                message: "JWT_SECRET is not configured."
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.json({

            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });

    } catch (error) {

        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed."
        });

    }

});

app.post("/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = req.body.password;
        const requestedRole = String(req.body.role || "representative").trim().toLowerCase();

        if (!name || !email || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Name, valid email and password (at least 8 characters) are required."
            });
        }

        if (await User.findOne({ email })) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        // Prevent self-registration as super_admin or admin
        const allowedSelfRegisterRoles = ["representative", "manager"];
        const role = allowedSelfRegisterRoles.includes(requestedRole)
            ? requestedRole
            : "representative";

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is not configured."
            });
        }

        const user = await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 12),
            role
        });

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(201).json({
            message: "Account registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed."
        });
    }
});


app.get("/profile", authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(
            req.user.id
        ).select("-password");

        if (!user) {

            return res.status(404).json({
                message: "User account not found."
            });

        }

        return res.json({
            message: "Authenticated user profile",
            user
        });

    } catch (error) {

        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Failed to retrieve profile."
        });

    }

});


app.post(
    "/admin/register-representative",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {

        try {

            const name = String(
                req.body.name || ""
            ).trim();

            const email = String(
                req.body.email || ""
            ).trim().toLowerCase();

            const password = req.body.password;

            if (
                !name ||
                !email ||
                typeof password !== "string" ||
                password.length < 8
            ) {
                return res.status(400).json({
                    message: "Name, valid email and password (at least 8 characters) are required."
                });
            }

            if (await User.findOne({ email })) {

                return res.status(409).json({
                    message: "Email already registered."
                });

            }

            const representative = await User.create({

                name,
                email,

                password: await bcrypt.hash(password, 12),

                role: "representative"

            });

            return res.status(201).json({

                message: "Field representative registered successfully",

                representative: {
                    id: representative._id,
                    name: representative.name,
                    email: representative.email,
                    role: representative.role
                }

            });

        } catch (error) {

            console.error("Representative registration error:", error);

            if (error.code === 11000) {

                return res.status(409).json({
                    message: "Email already registered."
                });

            }

            return res.status(500).json({
                message: "Representative registration failed."
            });

        }

    }
);


app.post(
    "/admin/register-manager",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {

        try {

            const name = String(
                req.body.name || ""
            ).trim();

            const email = String(
                req.body.email || ""
            ).trim().toLowerCase();

            const password = req.body.password;

            if (
                !name ||
                !email ||
                typeof password !== "string" ||
                password.length < 8
            ) {
                return res.status(400).json({
                    message: "Name, valid email and password (at least 8 characters) are required."
                });
            }

            if (await User.findOne({ email })) {

                return res.status(409).json({
                    message: "Email already registered."
                });

            }

            const manager = await User.create({

                name,
                email,

                password: await bcrypt.hash(password, 12),

                role: "manager"

            });

            return res.status(201).json({

                message: "Manager registered successfully",

                manager: {
                    id: manager._id,
                    name: manager.name,
                    email: manager.email,
                    role: manager.role
                }

            });

        } catch (error) {

            console.error("Manager registration error:", error);

            if (error.code === 11000) {

                return res.status(409).json({
                    message: "Email already registered."
                });

            }

            return res.status(500).json({
                message: "Manager registration failed."
            });

        }

    }
);


app.get(
    "/admin/representatives",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {

        try {

            const representatives = await User.find({
                role: "representative"
            })
                .select("-password")
                .populate("manager", "name email")
                .sort({ name: 1 });

            return res.json({

                message: "Representatives retrieved successfully",

                total: representatives.length,

                representatives

            });

        } catch (error) {

            console.error("Representatives error:", error);

            return res.status(500).json({
                message: "Failed to retrieve representatives."
            });

        }

    }
);

app.put(
    "/admin/assign-manager",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {

        try {

            const { managerId, representativeId } = req.body;

            if (
                !validId(managerId) ||
                !validId(representativeId)
            ) {
                return res.status(400).json({
                    message: "Valid managerId and representativeId are required."
                });
            }

            const [manager, representative] = await Promise.all([

                User.findOne({
                    _id: managerId,
                    role: "manager"
                }),

                User.findOne({
                    _id: representativeId,
                    role: "representative"
                })

            ]);

            if (!manager) {

                return res.status(404).json({
                    message: "Manager not found."
                });

            }

            if (!representative) {

                return res.status(404).json({
                    message: "Representative not found."
                });

            }

            representative.manager = manager._id;

            await representative.save();

            return res.json({

                message: "Representative assigned to manager successfully",

                representative: {
                    id: representative._id,
                    name: representative.name,
                    email: representative.email,
                    role: representative.role,
                    manager: manager._id,
                    managerName: manager.name
                }

            });

        } catch (error) {

            console.error("Assign manager error:", error);

            return res.status(500).json({
                message: "Failed to assign representative."
            });

        }

    }
);


app.get(
    "/manager/my-representatives",
    authMiddleware,
    roleMiddleware("manager"),
    async (req, res) => {

        try {

            const representatives = await User.find({

                role: "representative",

                manager: req.user.id

            })
                .select("-password")
                .sort({ name: 1 });

            return res.json({

                message: "Your representatives retrieved successfully",

                total: representatives.length,

                representatives

            });

        } catch (error) {

            console.error("Manager representatives error:", error);

            return res.status(500).json({
                message: "Failed to retrieve representatives."
            });

        }

    }
);

// Create a new business
app.post(
    "/businesses",
    authMiddleware,
    roleMiddleware("super_admin", "manager"),
    async (req, res) => {
        try {
            const businessName = String(req.body.businessName || "").trim();
            const address = String(req.body.address || "").trim();
            const area = String(req.body.area || "").trim();

            if (!businessName || !address || !area) {
                return res.status(400).json({
                    message: "Business name, address and area are required."
                });
            }

            let location;

            if (req.body.location !== undefined && req.body.location !== null) {
                const result = validateBusinessLocation(req.body.location);

                if (!result.valid) {
                    return res.status(400).json({
                        message: result.message
                    });
                }

                location = result.value;
            }

            const business = await Business.create({
                businessName,
                businessType: req.body.businessType,
                address,
                area,
                contactPerson: req.body.contactPerson,
                phone: req.body.phone,
                ...(location ? { location } : {}),
                createdBy: req.user.id
            });

            return res.status(201).json({
                message: "Business registered successfully",
                business
            });

        } catch (error) {
            return res.status(400).json({
                message: "Business registration failed",
                error: error.message
            });
        }
    }
);


// Get businesses according to user role
app.get("/businesses", authMiddleware, async (req, res) => {
    try {
        const { search, area, businessType } = req.query;

        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Invalid page or limit. Limit must be between 1 and 100."
            });
        }

        const filter = {
            isActive: { $ne: false }
        };

        if (req.user.role === "representative") {

            const assignments = await Assignment.find({
                representative: req.user.id
            }).select("business");

            filter._id = {
                $in: assignments.map(a => a.business)
            };

        } else if (req.user.role === "manager") {

            const repIds = await getManagerRepresentativeIds(req.user.id);

            const assignments = await Assignment.find({
                representative: { $in: repIds }
            }).select("business");

            filter._id = {
                $in: assignments.map(a => a.business)
            };

        } else if (req.user.role !== "super_admin") {

            return res.status(403).json({
                message: "Access denied."
            });
        }

        if (search) {
            filter.businessName = {
                $regex: escapeRegex(search),
                $options: "i"
            };
        }

        if (area) {
            filter.area = {
                $regex: escapeRegex(area),
                $options: "i"
            };
        }

        if (businessType) {
            filter.businessType = {
                $regex: escapeRegex(businessType),
                $options: "i"
            };
        }

        const [totalBusinesses, businesses] = await Promise.all([
            Business.countDocuments(filter),

            Business.find(filter)
                .populate("createdBy", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(totalBusinesses / limit);

        return res.json({
            message: "Businesses retrieved successfully",

            pagination: {
                totalBusinesses,
                currentPage: page,
                totalPages,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },

            businesses
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve businesses",
            error: error.message
        });
    }
});


// Update a business
app.put("/businesses/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                message: "Invalid business ID."
            });
        }

        const business = await Business.findById(id);

        if (!business || business.isActive === false) {
            return res.status(404).json({
                message: "Active business not found."
            });
        }

        // Managers can only update businesses assigned to their team.
        if (req.user.role === "manager") {

            const repIds = await getManagerRepresentativeIds(req.user.id);

            const assignment = await Assignment.findOne({
                business: id,
                representative: { $in: repIds }
            });

            if (!assignment) {
                return res.status(403).json({
                    message: "You cannot update this business."
                });
            }

        } else if (req.user.role !== "super_admin") {

            return res.status(403).json({
                message: "You do not have permission to update businesses."
            });
        }

        const allowedFields = [
            "businessName",
            "businessType",
            "address",
            "area",
            "contactPerson",
            "phone"
        ];

        const updates = {};

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] =
                    typeof req.body[key] === "string"
                        ? req.body[key].trim()
                        : req.body[key];
            }
        }

        if (req.body.location !== undefined) {

            if (req.body.location === null) {
                updates.location = undefined;
            } else {
                const result = validateBusinessLocation(req.body.location);

                if (!result.valid) {
                    return res.status(400).json({
                        message: result.message
                    });
                }

                updates.location = result.value;
            }
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({
                message: "No valid fields provided for update."
            });
        }

        const updated = await Business.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        return res.json({
            message: "Business updated successfully",
            business: updated
        });

    } catch (error) {
        return res.status(400).json({
            message: "Failed to update business",
            error: error.message
        });
    }
});


// Archive a business
app.delete(
    "/businesses/:id",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            if (!validId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid business ID."
                });
            }

            const business = await Business.findById(req.params.id);

            if (!business) {
                return res.status(404).json({
                    message: "Business not found."
                });
            }

            if (business.isActive === false) {
                return res.status(409).json({
                    message: "Business is already archived."
                });
            }

            business.isActive = false;
            await business.save();

            return res.json({
                message: "Business archived successfully",
                business
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to archive business",
                error: error.message
            });
        }
    }
);


// Restore an archived business
app.patch(
    "/admin/businesses/:id/restore",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            if (!validId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid business ID."
                });
            }

            const business = await Business.findById(req.params.id);

            if (!business) {
                return res.status(404).json({
                    message: "Business not found."
                });
            }

            if (business.isActive !== false) {
                return res.status(409).json({
                    message: "Business is not archived."
                });
            }

            business.isActive = true;
            await business.save();

            return res.json({
                message: "Business restored successfully",
                business
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to restore business",
                error: error.message
            });
        }
    }
);


// Get archived businesses
app.get(
    "/admin/archived-businesses",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const businesses = await Business.find({
                isActive: false
            })
                .populate("createdBy", "name email")
                .sort({ updatedAt: -1 });

            return res.json({
                message: "Archived businesses retrieved successfully",
                total: businesses.length,
                businesses
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve archived businesses",
                error: error.message
            });
        }
    }
);


// Shared assignment creation function
async function createAssignment(req, res, assignedByRole) {
    try {
        const { businessId, representativeId } = req.body;

        if (!validId(businessId) || !validId(representativeId)) {
            return res.status(400).json({
                message: "Valid businessId and representativeId are required."
            });
        }

        const business = await Business.findOne({
            _id: businessId,
            isActive: { $ne: false }
        });

        if (!business) {
            return res.status(404).json({
                message: "Active business not found."
            });
        }

        const representativeFilter = {
            _id: representativeId,
            role: "representative"
        };

        if (assignedByRole === "manager") {
            representativeFilter.manager = req.user.id;
        }

        const representative = await User.findOne(representativeFilter);

        if (!representative) {
            return res.status(404).json({
                message: "Representative not found or not part of your team."
            });
        }

        // Prevent duplicate active assignments.
        const existing = await Assignment.findOne({
            business: business._id,
            representative: representative._id,
            status: {
                $in: ["pending", "in-progress"]
            }
        });

        if (existing) {
            return res.status(409).json({
                message: "This business already has an active assignment for this representative.",
                assignment: existing
            });
        }

        const assignment = await Assignment.create({
            business: business._id,
            representative: representative._id,
            assignedBy: req.user.id
        });

        return res.status(201).json({
            message: "Business assigned successfully",
            assignment
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This assignment already exists."
            });
        }

        return res.status(500).json({
            message: "Assignment failed",
            error: error.message
        });
    }
}


// Admin assigns a business
app.post(
    "/admin/assign-business",
    authMiddleware,
    roleMiddleware("super_admin"),
    (req, res) => createAssignment(req, res, "super_admin")
);


// Manager assigns a business to their representative
app.post(
    "/manager/assign-business",
    authMiddleware,
    roleMiddleware("manager"),
    (req, res) => createAssignment(req, res, "manager")
);


// Representative views their assignments
app.get(
    "/representative/my-assignments",
    authMiddleware,
    roleMiddleware("representative"),
    async (req, res) => {
        try {
            const assignments = await Assignment.find({
                representative: req.user.id
            })
                .populate({
                    path: "business",
                    match: { isActive: { $ne: false } }
                })
                .populate("assignedBy", "name email")
                .sort({ createdAt: -1 });

            return res.json({
                message: "Your assignments retrieved successfully",
                total: assignments.length,
                assignments
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve assignments",
                error: error.message
            });
        }
    }
);


// Representative updates assignment status
app.put(
    "/representative/assignments/:id/status",
    authMiddleware,
    roleMiddleware("representative"),
    async (req, res) => {
        try {
            if (!validId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid assignment ID."
                });
            }

            const { status } = req.body;

            if (!["pending", "in-progress"].includes(status)) {
                return res.status(400).json({
                    message: "You can only set an assignment to pending or in-progress. Submit a visit report to complete it."
                });
            }

            const assignment = await Assignment.findOne({
                _id: req.params.id,
                representative: req.user.id
            });

            if (!assignment) {
                return res.status(404).json({
                    message: "Assignment not found."
                });
            }

            const report = await VisitReport.findOne({
                assignment: assignment._id
            });

            if (report) {
                return res.status(409).json({
                    message: "This assignment already has a visit report. Complete its follow-up if one is pending."
                });
            }

            if (assignment.status === "completed") {
                return res.status(409).json({
                    message: "This assignment is already completed."
                });
            }

            assignment.status = status;
            await assignment.save();

            await assignment.populate("business");

            return res.json({
                message: "Assignment status updated successfully",
                assignment
            });

        } catch (error) {
            return res.status(500).json({
                message: "Status update failed",
                error: error.message
            });
        }
    }
);


// Manager views assignments belonging to their team
app.get(
    "/manager/my-team-assignments",
    authMiddleware,
    roleMiddleware("manager"),
    async (req, res) => {
        try {
            const repIds = await getManagerRepresentativeIds(req.user.id);

            const assignments = await Assignment.find({
                representative: { $in: repIds }
            })
                .populate("business")
                .populate("representative", "name email")
                .populate("assignedBy", "name email")
                .sort({ createdAt: -1 });

            return res.json({
                message: "Team assignments retrieved successfully",
                total: assignments.length,
                assignments
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve team assignments",
                error: error.message
            });
        }
    }
);

async function handleVisitReportUpload(req, res, next) {
    upload.array("photos", 5)(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        next();
    });
}


function isValidImageSignature(buffer, mimetype) {
    if (!buffer || buffer.length < 12) {
        return false;
    }

    if (mimetype === "image/jpeg") {
        return (
            buffer[0] === 0xff &&
            buffer[1] === 0xd8 &&
            buffer[2] === 0xff
        );
    }

    if (mimetype === "image/png") {
        return buffer.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        );
    }

    if (mimetype === "image/webp") {
        return (
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
        );
    }

    return false;
}


function parseVisitLocation(value) {
    if (!value) {
        return null;
    }

    let location = value;

    if (typeof location === "string") {
        try {
            location = JSON.parse(location);
        } catch {
            return null;
        }
    }

    if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location)
    ) {
        return null;
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const accuracy =
        location.accuracy === undefined
            ? null
            : Number(location.accuracy);

    const capturedAt = location.capturedAt
        ? new Date(location.capturedAt)
        : null;

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null;
    }

    if (
        accuracy !== null &&
        (!Number.isFinite(accuracy) || accuracy < 0)
    ) {
        return null;
    }

    if (
        capturedAt &&
        Number.isNaN(capturedAt.getTime())
    ) {
        return null;
    }

    return {
        latitude,
        longitude,
        ...(accuracy !== null ? { accuracy } : {}),
        ...(capturedAt ? { capturedAt } : {})
    };
}


async function deleteCloudinaryPhotos(photos) {
    for (const photo of photos) {
        try {
            if (photo.publicId) {
                await cloudinary.uploader.destroy(
                    photo.publicId,
                    { resource_type: "image" }
                );
            }
        } catch (error) {
            console.error(
                "Cloudinary cleanup failed:",
                error.message
            );
        }
    }
}


app.get(
    "/admin/managers",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const managers = await User.find({
                role: "manager"
            })
                .select("-password")
                .sort({ name: 1 });

            return res.json({
                message: "Managers retrieved successfully",
                total: managers.length,
                managers
            });

        } catch (error) {
            console.error("Managers error:", error);

            return res.status(500).json({
                message: "Failed to retrieve managers."
            });
        }
    }
);


// Submit a representative visit report
app.post(
    "/representative/visit-reports",
    authMiddleware,
    roleMiddleware("representative"),
    handleVisitReportUpload,
    async (req, res) => {
        const uploadedPhotos = [];

        try {
            const {
                assignmentId,
                outcome,
                remarks,
                nextFollowUpDate,
                followUpRemarks
            } = req.body;

            if (!validId(assignmentId)) {
                return res.status(400).json({
                    message: "A valid assignmentId is required."
                });
            }

            if (
                !["interested", "not-interested", "follow-up-required"].includes(outcome)
            ) {
                return res.status(400).json({
                    message: "Invalid visit outcome."
                });
            }

            if (!remarks || !String(remarks).trim()) {
                return res.status(400).json({
                    message: "Visit remarks are required."
                });
            }

            const assignment = await Assignment.findOne({
                _id: assignmentId,
                representative: req.user.id
            }).populate("business");

            if (!assignment || !assignment.business) {
                return res.status(404).json({
                    message: "Assignment or its business was not found."
                });
            }

            if (assignment.business.isActive === false) {
                return res.status(409).json({
                    message: "This business is archived."
                });
            }

            if (assignment.status === "completed") {
                return res.status(409).json({
                    message: "This assignment is already completed."
                });
            }

            const existingReport = await VisitReport.findOne({
                assignment: assignment._id
            });

            if (existingReport) {
                return res.status(409).json({
                    message: "A visit report already exists for this assignment."
                });
            }

            if (
                outcome === "follow-up-required" &&
                !nextFollowUpDate
            ) {
                return res.status(400).json({
                    message: "A follow-up date is required for this outcome."
                });
            }

            if (
                outcome !== "follow-up-required" &&
                nextFollowUpDate
            ) {
                return res.status(400).json({
                    message: "A follow-up date is only allowed when follow-up is required."
                });
            }

            let parsedFollowUpDate;

            if (nextFollowUpDate) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUpDate)) {
                    parsedFollowUpDate = nepalDateBoundary(
                        nextFollowUpDate
                    );

                    if (!parsedFollowUpDate) {
                        return res.status(400).json({
                            message: "Invalid follow-up date."
                        });
                    }
                } else {
                    parsedFollowUpDate = new Date(nextFollowUpDate);

                    if (Number.isNaN(parsedFollowUpDate.getTime())) {
                        return res.status(400).json({
                            message: "Invalid follow-up date."
                        });
                    }
                }

                const todayStart = nepalDateBoundary(getNepalDate());

                if (parsedFollowUpDate < todayStart) {
                    return res.status(400).json({
                        message: "Follow-up date cannot be in the past."
                    });
                }
            }

            let locationInput = req.body.location;

            if (!locationInput && req.body.latitude !== undefined) {
                locationInput = {
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    accuracy: req.body.accuracy,
                    capturedAt: req.body.capturedAt
                };
            }

            const visitLocation = parseVisitLocation(locationInput);

            let locationVerificationStatus = "unverified";

            if (
                visitLocation &&
                assignment.business.location &&
                visitLocation.accuracy !== undefined &&
                visitLocation.accuracy <= 50 &&
                visitLocation.capturedAt
            ) {
                const now = Date.now();
                const captureTime = visitLocation.capturedAt.getTime();

                const isRecent =
                    captureTime <= now + 60 * 1000 &&
                    captureTime >= now - 5 * 60 * 1000;

                if (isRecent) {
                    const distance = calculateDistance(
                        visitLocation.latitude,
                        visitLocation.longitude,
                        assignment.business.location.latitude,
                        assignment.business.location.longitude
                    );

                    if (
                        Number.isFinite(distance) &&
                        distance <= 100
                    ) {
                        locationVerificationStatus = "verified";
                    }
                }
            }

            const files = req.files || [];

            for (const file of files) {
                if (!isValidImageSignature(file.buffer, file.mimetype)) {
                    return res.status(400).json({
                        message: "One or more uploaded files are not valid JPEG, PNG or WebP images."
                    });
                }
            }

            for (const file of files) {
                const uploaded = await uploadToCloudinary(file.buffer);

                uploadedPhotos.push({
                    url: uploaded.url,
                    publicId: uploaded.publicId,
                    uploadedAt: new Date()
                });
            }

            const report = await VisitReport.create({
                assignment: assignment._id,
                business: assignment.business._id,
                representative: req.user.id,
                visitDate: new Date(),
                outcome,
                remarks: String(remarks).trim(),
                ...(visitLocation ? { location: visitLocation } : {}),
                locationVerificationStatus,
                photos: uploadedPhotos,
                ...(parsedFollowUpDate
                    ? { nextFollowUpDate: parsedFollowUpDate }
                    : {}),
                followUpStatus:
                    outcome === "follow-up-required"
                        ? "pending"
                        : "not-required",
                followUpRemarks: followUpRemarks || ""
            });

            assignment.status =
                outcome === "follow-up-required"
                    ? "in-progress"
                    : "completed";

            await assignment.save();

            return res.status(201).json({
                message: "Visit report submitted successfully",
                report
            });

        } catch (error) {
            await deleteCloudinaryPhotos(uploadedPhotos);

            if (error.code === 11000) {
                return res.status(409).json({
                    message: "A visit report already exists for this assignment."
                });
            }

            if (
                error.name === "ValidationError" ||
                error.name === "CastError"
            ) {
                return res.status(400).json({
                    message: "Invalid visit report data.",
                    error: error.message
                });
            }

            return res.status(500).json({
                message: "Visit report submission failed",
                error: error.message
            });
        }
    }
);


// Admin views all visit reports
app.get(
    "/admin/visit-reports",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);

            if (
                !Number.isInteger(page) ||
                !Number.isInteger(limit) ||
                page < 1 ||
                limit < 1 ||
                limit > 100
            ) {
                return res.status(400).json({
                    message: "Invalid pagination values."
                });
            }

            const filter = {};

            if (req.query.outcome) {
                filter.outcome = req.query.outcome;
            }

            if (req.query.representativeId) {
                if (!validId(req.query.representativeId)) {
                    return res.status(400).json({
                        message: "Invalid representative ID."
                    });
                }

                filter.representative = req.query.representativeId;
            }

            if (req.query.startDate || req.query.endDate) {
                const dateFilter = {};

                if (req.query.startDate) {
                    const start = nepalDateBoundary(req.query.startDate);

                    if (!start) {
                        return res.status(400).json({
                            message: "Invalid start date."
                        });
                    }

                    dateFilter.$gte = start;
                }

                if (req.query.endDate) {
                    const end = nepalDateBoundary(
                        req.query.endDate,
                        true
                    );

                    if (!end) {
                        return res.status(400).json({
                            message: "Invalid end date."
                        });
                    }

                    dateFilter.$lte = end;
                }

                filter.visitDate = dateFilter;
            }

            const [total, reports] = await Promise.all([
                VisitReport.countDocuments(filter),

                VisitReport.find(filter)
                    .populate("business", "businessName area address")
                    .populate("representative", "name email")
                    .populate("assignment")
                    .sort({ visitDate: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
            ]);

            return res.json({
                message: "Visit reports retrieved successfully",
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                },
                reports
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve visit reports",
                error: error.message
            });
        }
    }
);


// Manager views visit reports submitted by their team
app.get(
    "/manager/my-team-visit-reports",
    authMiddleware,
    roleMiddleware("manager"),
    async (req, res) => {
        try {
            const repIds = await getManagerRepresentativeIds(req.user.id);

            const filter = {
                representative: { $in: repIds }
            };

            if (req.query.startDate || req.query.endDate) {
                const dateFilter = {};

                if (req.query.startDate) {
                    const start = nepalDateBoundary(req.query.startDate);

                    if (!start) {
                        return res.status(400).json({
                            message: "Invalid start date."
                        });
                    }

                    dateFilter.$gte = start;
                }

                if (req.query.endDate) {
                    const end = nepalDateBoundary(
                        req.query.endDate,
                        true
                    );

                    if (!end) {
                        return res.status(400).json({
                            message: "Invalid end date."
                        });
                    }

                    dateFilter.$lte = end;
                }

                filter.visitDate = dateFilter;
            }

            const reports = await VisitReport.find(filter)
                .populate("business", "businessName area address")
                .populate("representative", "name email")
                .populate("assignment")
                .sort({ visitDate: -1 });

            return res.json({
                message: "Team visit reports retrieved successfully",
                total: reports.length,
                reports
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve team visit reports",
                error: error.message
            });
        }
    }
);

// Manager team performance
app.get(
    "/manager/team-performance",
    authMiddleware,
    roleMiddleware("manager"),
    async (req, res) => {
        try {
            const representatives = await User.find({
                manager: req.user.id,
                role: "representative"
            }).select("name email");

            const performance = [];

            for (const representative of representatives) {
                const assignments = await Assignment.find({
                    representative: representative._id
                });

                const reports = await VisitReport.find({
                    representative: representative._id
                });

                const completedAssignments = assignments.filter(
                    a => a.status === "completed"
                ).length;

                const pendingAssignments = assignments.filter(
                    a => a.status === "pending"
                ).length;

                const inProgressAssignments = assignments.filter(
                    a => a.status === "in-progress"
                ).length;

                performance.push({
                    representative,
                    totalAssignments: assignments.length,
                    completedAssignments,
                    pendingAssignments,
                    inProgressAssignments,
                    totalVisits: reports.length,
                    interestedVisits: reports.filter(
                        r => r.outcome === "interested"
                    ).length,
                    notInterestedVisits: reports.filter(
                        r => r.outcome === "not-interested"
                    ).length,
                    followUpRequired: reports.filter(
                        r => r.followUpStatus === "pending"
                    ).length
                });
            }

            return res.json({
                message: "Team performance retrieved successfully",
                totalRepresentatives: performance.length,
                performance
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve team performance",
                error: error.message
            });
        }
    }
);


// Admin dashboard statistics
app.get(
    "/admin/dashboard-stats",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const today = getNepalDate();
            const todayStart = nepalDateBoundary(today);
            const tomorrowStart = new Date(
                todayStart.getTime() + 24 * 60 * 60 * 1000
            );

            const [
                totalUsers,
                totalManagers,
                totalRepresentatives,
                totalBusinesses,
                archivedBusinesses,
                totalAssignments,
                completedAssignments,
                pendingAssignments,
                inProgressAssignments,
                totalVisitReports,
                todayVisitReports,
                pendingFollowUps,
                completedFollowUps
            ] = await Promise.all([

                User.countDocuments(),

                User.countDocuments({
                    role: "manager"
                }),

                User.countDocuments({
                    role: "representative"
                }),

                Business.countDocuments({
                    isActive: { $ne: false }
                }),

                Business.countDocuments({
                    isActive: false
                }),

                Assignment.countDocuments(),

                Assignment.countDocuments({
                    status: "completed"
                }),

                Assignment.countDocuments({
                    status: "pending"
                }),

                Assignment.countDocuments({
                    status: "in-progress"
                }),

                VisitReport.countDocuments(),

                VisitReport.countDocuments({
                    visitDate: {
                        $gte: todayStart,
                        $lt: tomorrowStart
                    }
                }),

                VisitReport.countDocuments({
                    followUpStatus: "pending"
                }),

                VisitReport.countDocuments({
                    followUpStatus: "completed"
                })
            ]);

            return res.json({
                message: "Dashboard statistics retrieved successfully",

                date: today,

                users: {
                    total: totalUsers,
                    managers: totalManagers,
                    representatives: totalRepresentatives
                },

                businesses: {
                    active: totalBusinesses,
                    archived: archivedBusinesses
                },

                assignments: {
                    total: totalAssignments,
                    completed: completedAssignments,
                    pending: pendingAssignments,
                    inProgress: inProgressAssignments
                },

                visits: {
                    total: totalVisitReports,
                    today: todayVisitReports
                },

                followUps: {
                    pending: pendingFollowUps,
                    completed: completedFollowUps
                }
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve dashboard statistics",
                error: error.message
            });
        }
    }
);


// Admin area-wise business statistics
app.get(
    "/admin/area-statistics",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const statistics = await Business.aggregate([
                {
                    $match: {
                        isActive: { $ne: false }
                    }
                },
                {
                    $group: {
                        _id: "$area",
                        totalBusinesses: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        totalBusinesses: -1
                    }
                }
            ]);

            return res.json({
                message: "Area statistics retrieved successfully",
                totalAreas: statistics.length,
                statistics: statistics.map(item => ({
                    area: item._id,
                    totalBusinesses: item.totalBusinesses
                }))
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve area statistics",
                error: error.message
            });
        }
    }
);


// Shared follow-up listing function
async function listFollowUps(req, res, role) {
    try {
        const todayStart = nepalDateBoundary(getNepalDate());

        const filter = {
            followUpStatus: "pending"
        };

        if (role === "manager") {
            const repIds = await getManagerRepresentativeIds(req.user.id);

            filter.representative = {
                $in: repIds
            };

        } else if (role === "representative") {
            filter.representative = req.user.id;
        }

        if (req.query.startDate || req.query.endDate) {
            const dateFilter = {};

            if (req.query.startDate) {
                const start = nepalDateBoundary(req.query.startDate);

                if (!start) {
                    return res.status(400).json({
                        message: "Invalid start date."
                    });
                }

                dateFilter.$gte = start;
            }

            if (req.query.endDate) {
                const end = nepalDateBoundary(
                    req.query.endDate,
                    true
                );

                if (!end) {
                    return res.status(400).json({
                        message: "Invalid end date."
                    });
                }

                dateFilter.$lte = end;
            }

            filter.nextFollowUpDate = dateFilter;
        }

        const reports = await VisitReport.find(filter)
            .populate("business", "businessName area address phone")
            .populate("representative", "name email")
            .populate("assignment")
            .sort({
                nextFollowUpDate: 1
            });

        return res.json({
            message: "Pending follow-ups retrieved successfully",
            total: reports.length,
            overdue: reports.filter(
                report => report.nextFollowUpDate < todayStart
            ).length,
            followUps: reports
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve follow-ups",
            error: error.message
        });
    }
}


// Admin views all pending follow-ups
app.get(
    "/admin/pending-follow-ups",
    authMiddleware,
    roleMiddleware("super_admin"),
    (req, res) => listFollowUps(req, res, "admin")
);


// Manager views team pending follow-ups
app.get(
    "/manager/pending-follow-ups",
    authMiddleware,
    roleMiddleware("manager"),
    (req, res) => listFollowUps(req, res, "manager")
);


// Representative views personal pending follow-ups
app.get(
    "/representative/my-pending-follow-ups",
    authMiddleware,
    roleMiddleware("representative"),
    (req, res) => listFollowUps(req, res, "representative")
);


// Admin views overdue follow-ups
app.get(
    "/admin/overdue-follow-ups",
    authMiddleware,
    roleMiddleware("super_admin"),
    async (req, res) => {
        try {
            const todayStart = nepalDateBoundary(getNepalDate());

            const reports = await VisitReport.find({
                followUpStatus: "pending",
                nextFollowUpDate: {
                    $lt: todayStart
                }
            })
                .populate("business", "businessName area address phone")
                .populate("representative", "name email")
                .populate("assignment")
                .sort({
                    nextFollowUpDate: 1
                });

            return res.json({
                message: "Overdue follow-ups retrieved successfully",
                total: reports.length,
                followUps: reports
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve overdue follow-ups",
                error: error.message
            });
        }
    }
);


// Representative updates a pending follow-up
app.patch(
    "/representative/visit-reports/:id/follow-up",
    authMiddleware,
    roleMiddleware("representative"),
    async (req, res) => {
        try {
            if (!validId(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid visit report ID."
                });
            }

            const { followUpStatus, followUpRemarks } = req.body;

            if (
                !["completed", "cancelled"].includes(followUpStatus)
            ) {
                return res.status(400).json({
                    message: "Follow-up status must be completed or cancelled."
                });
            }

            const report = await VisitReport.findOne({
                _id: req.params.id,
                representative: req.user.id
            });

            if (!report) {
                return res.status(404).json({
                    message: "Visit report not found."
                });
            }

            if (report.followUpStatus !== "pending") {
                return res.status(409).json({
                    message: "This follow-up is no longer pending."
                });
            }

            report.followUpStatus = followUpStatus;

            if (followUpRemarks !== undefined) {
                report.followUpRemarks = String(
                    followUpRemarks
                ).trim();
            }

            await report.save();

            const assignment = await Assignment.findById(
                report.assignment
            );

            if (assignment) {
                assignment.status =
                    followUpStatus === "completed"
                        ? "completed"
                        : "in-progress";

                await assignment.save();
            }

            return res.json({
                message: "Follow-up updated successfully",
                report
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to update follow-up",
                error: error.message
            });
        }
    }
);


// Handle unknown routes
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found"
    });
});


// Connect MongoDB and start server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        if (
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        ) {
            cloudinary.api.ping()
                .then(() => {
                    console.log("Cloudinary Connected");
                })
                .catch(error => {
                    console.error(
                        "Cloudinary connection check failed:",
                        error.message
                    );
                });
        }

        app.listen(PORT, () => {
            console.log(`FMMS server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });