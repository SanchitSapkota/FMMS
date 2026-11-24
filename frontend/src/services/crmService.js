import api from "./api";

const normalizeFollowUp = (item) => {
    const business =
        item?.business && typeof item.business === "object"
            ? item.business
            : {};

    const representative =
        item?.representative &&
        typeof item.representative === "object"
            ? item.representative
            : {};

    return {
        ...item,
        id: item?._id || item?.id,
        targetName:
            business?.businessName ||
            item?.businessName ||
            item?.targetName ||
            "",
        repName:
            representative?.name ||
            item?.repName ||
            "",
        dueDate:
            item?.nextFollowUpDate ||
            item?.dueDate ||
            "",
        status:
            item?.followUpStatus ||
            item?.status ||
            "pending",
        notes:
            item?.followUpRemarks ||
            item?.remarks ||
            item?.notes ||
            "",
    };
};

const extractList = (data) => {
    const records =
        data?.reports ||
        data?.followUps ||
        data?.data ||
        (Array.isArray(data) ? data : []);

    return Array.isArray(records)
        ? records.map(normalizeFollowUp)
        : [];
};

const getRole = () => {
    try {
        const token = localStorage.getItem("fmms_jwt_token");

        if (!token) return "";

        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        return String(
            payload.role ||
            payload.user?.role ||
            payload.data?.role ||
            ""
        ).toLowerCase();
    } catch {
        return "";
    }
};

const getFollowUpEndpoint = () => {
    const role = getRole();

    if (role === "super_admin" || role === "admin") {
        return "/admin/pending-follow-ups";
    }

    if (role === "manager") {
        return "/manager/pending-follow-ups";
    }

    if (role === "representative" || role === "rep") {
        return "/representative/my-pending-follow-ups";
    }

    throw new Error("Unable to determine your account role.");
};

export const crmService = {
    // Leads are not a separate feature in the current backend.
    async getLeads() {
        return [];
    },

    async createLead() {
        throw new Error(
            "Lead creation is not supported by the current FMMS backend."
        );
    },

    // Retrieve role-specific pending follow-ups.
    async getFollowUps() {
        const endpoint = getFollowUpEndpoint();

        const { data } = await api.get(endpoint);

        return extractList(data);
    },

    // Follow-ups are updated through the associated visit report.
    async toggleFollowUpStatus(id, currentStatus) {
        if (!id) {
            throw new Error("Visit report ID is required.");
        }

        const nextStatus =
            String(currentStatus).toLowerCase() === "completed"
                ? "pending"
                : "completed";

        const { data } = await api.patch(
            `/representative/visit-reports/${id}/follow-up`,
            {
                followUpStatus: nextStatus,
            }
        );

        return normalizeFollowUp(
            data?.report || data?.data || data
        );
    },

    async createFollowUp() {
        throw new Error(
            "Create a follow-up through a visit report instead."
        );
    },
};