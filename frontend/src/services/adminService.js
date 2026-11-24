
import api from "./api";
import { ROLES } from "../config/roles";

export const adminService = {
    // Get representatives registered in the system
    async getUsers() {
        const { data } = await api.get("/admin/representatives");

        return data.representatives || [];
    },

    // Register a manager or representative
    async createUser(user) {
        const role = user.role;

        let endpoint;

        if (role === ROLES.MANAGER || role === "manager") {
            endpoint = "/admin/register-manager";
        } else if (
            role === ROLES.REP ||
            role === "representative"
        ) {
            endpoint = "/admin/register-representative";
        } else {
            throw new Error(
                "Unsupported user role. Only managers and representatives can be registered here."
            );
        }

        const { data } = await api.post(endpoint, {
            name: user.name,
            email: user.email,
            password: user.password,
        });

        return data;
    },

    // Get area statistics from the existing backend
    async getAreas() {
        const { data } = await api.get("/admin/area-statistics");

        return data;
    },

    // Area creation is not supported by the current backend
    async createArea() {
        throw new Error(
            "Area creation is not available in the current FMMS backend."
        );
    },

    // Activity logs endpoint does not currently exist
    async getActivityLogs() {
        return [];
    },
};
