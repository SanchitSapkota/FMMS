
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createSuperAdmin() {
    try {
        const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

        if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
            throw new Error("Super Admin environment variables are missing.");
        }

        await mongoose.connect(
            process.env.MONGO_URI ||
            "mongodb://127.0.0.1:27017/FMMS"
        );

        console.log("MongoDB Connected");

        const existingAdmin = await User.findOne({
            role: "super_admin"
        });

        if (existingAdmin) {
            console.log("A Super Admin already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            SUPER_ADMIN_PASSWORD,
            12
        );

        const admin = new User({
            name: SUPER_ADMIN_NAME,
            email: SUPER_ADMIN_EMAIL.toLowerCase().trim(),
            password: hashedPassword,
            role: "super_admin"
        });

        await admin.save();

        console.log("Super Admin created successfully!");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

createSuperAdmin();

