import api from "./api";
import API_CONFIG from "../config/api.config";

export const fetchNotifications = async (role, params = {}) => {
    // Switch to the properly paginated unseen endpoint
    const endpoint = `/unseen-notifications-by-role`;
    const res = await api.get(endpoint, {
        params: { ...params, role }
    });
    return res.data;
};

export const fetchAllNotifications = async (role, params = {}) => {
    const endpoint = role === 'SUPER_ADMIN'
        ? API_CONFIG.ENDPOINTS.ALL_NOTIFICATIONS_SUPER
        : API_CONFIG.ENDPOINTS.ALL_NOTIFICATIONS_ADMIN;

    const res = await api.get(endpoint, { params });
    return res.data;
};

export const fetchNotificationsByStatus = async (status, role, params = {}) => {
    // Both Super Admin and Admin use the same status endpoint as per Controller.java
    const res = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS_STATUS, {
        params: { ...params, status: status.toUpperCase(), role }
    });
    return res.data;
};

export const markAsSeen = async (id) => {
    return await api.put(`/${id}/seen`);
};

export const markAllAsSeen = async (role) => {
    return await api.put(API_CONFIG.ENDPOINTS.MARK_ALL_SEEN, null, {
        params: { role }
    });
};

export const approveRequest = async (id) => {
    return await api.put(`/${id}/approve`, {});
};

export const rejectRequest = async (id, reason) => {
    return await api.put(`/${id}/reject`, { reason });
};
