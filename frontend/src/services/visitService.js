
import api from "./api";
import { ROLES } from "../config/roles";

const getTokenRole = () => {
    try {
        const token = localStorage.getItem("fmms_jwt_token");

        if (!token) return null;

        const payload = JSON.parse(
            atob(
                token.split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        return (
            payload.role ||
            payload.user?.role ||
            payload.data?.role ||
            null
        );
    } catch (error) {
        console.error("Unable to read token role:", error);
        return null;
    }
};

const normalizeRole = (role) => {
    const value = String(role || "").toLowerCase();

    if (
        value === "admin" ||
        value === "super_admin" ||
        value === String(ROLES.ADMIN).toLowerCase()
    ) {
        return "admin";
    }

    if (
        value === "manager" ||
        value === String(ROLES.MANAGER).toLowerCase()
    ) {
        return "manager";
    }

    if (
        value === "rep" ||
        value === "representative" ||
        value === String(ROLES.REP).toLowerCase()
    ) {
        return "representative";
    }

    return null;
};

const getListEndpoint = (role) => {
    const normalizedRole = normalizeRole(role);

    switch (normalizedRole) {
        case "admin":
            return "/admin/visit-reports";

        case "manager":
            return "/manager/my-team-visit-reports";

        case "representative":
            return "/representative/my-assignments";

        default:
            throw new Error(
                "Unable to determine user role. Please log in again."
            );
    }
};

const normalizeVisit = (item = {}) => {
    const business =
        item.business && typeof item.business === "object"
            ? item.business
            : {};

    const assignment =
        item.assignment && typeof item.assignment === "object"
            ? item.assignment
            : {};

    const representative =
        item.representative &&
        typeof item.representative === "object"
            ? item.representative
            : {};

    return {
        ...item,

        id: item._id || item.id,

        businessName:
            item.businessName ||
            business.businessName ||
            "",

        address:
            item.address ||
            business.address ||
            "",

        area:
            item.area ||
            business.area ||
            "",

        repId:
            item.repId ||
            representative._id ||
            representative.id ||
            (typeof item.representative === "string"
                ? item.representative
                : ""),

        repName:
            item.repName ||
            representative.name ||
            "",

        assignmentId:
            item.assignmentId ||
            assignment._id ||
            assignment.id ||
            (typeof item.assignment === "string"
                ? item.assignment
                : ""),

        status:
            item.status ||
            assignment.status ||
            "pending",

        visitDate:
            item.visitDate ||
            item.createdAt ||
            "",
    };
};

const extractList = (data) => {
    const list =
        data?.reports ||
        data?.assignments ||
        data?.visits ||
        data?.data ||
        (Array.isArray(data) ? data : []);

    return Array.isArray(list)
        ? list.map(normalizeVisit)
        : [];
};

export const visitService = {
    async list(params = {}) {
        const {
            role,
            endpoint,
            ...queryParams
        } = params;

        const userRole = role || getTokenRole();

        const url = endpoint || getListEndpoint(userRole);

        const { data } = await api.get(url, {
            params: queryParams,
        });

        return extractList(data);
    },

    async getById(id, params = {}) {
        const visits = await this.list(params);

        const record = visits.find(
            (visit) =>
                String(visit.id) === String(id) ||
                String(visit.assignmentId) === String(id)
        );

        if (!record) {
            throw new Error(
                "Record not found in the available records."
            );
        }

        return record;
    },

    async create(payload) {
        const isFormData =
            typeof FormData !== "undefined" &&
            payload instanceof FormData;

        const { data } = await api.post(
            "/representative/visit-reports",
            payload,
            isFormData
                ? {
                    headers: {
                        "Content-Type": undefined,
                    },
                }
                : {}
        );

        const record =
            data?.report ||
            data?.visit ||
            data?.data ||
            data;

        return normalizeVisit(record);
    },

    async update(id, payload) {
        if (
            payload &&
            Object.keys(payload).length === 1 &&
            payload.status
        ) {
            const { data } = await api.put(
                `/representative/assignments/${id}/status`,
                {
                    status: payload.status,
                }
            );

            return normalizeVisit(
                data?.assignment ||
                data?.data ||
                data
            );
        }

        const { data } = await api.patch(
            `/representative/visit-reports/${id}/follow-up`,
            payload
        );

        return normalizeVisit(
            data?.report ||
            data?.data ||
            data
        );
    },
};

