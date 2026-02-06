import api from "./api";
import API_CONFIG from "../config/api.config";

/**
 * Role-Based Notifications (Approval Requests)
 */
export const fetchUnseenRoleNotifications = async (params = {}) => {
    const res = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNSEEN_ROLE, {
        params: { limit: 20, ...params }
    });
    return res.data;
};

export const markRoleNotificationsSeen = async (notificationIds) => {
    // Expects an array or set of IDs in the request body
    return await api.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS_SEEN_ALL, notificationIds);
};

export const fetchAllNotifications = async (role, params = {}) => {
    const endpoint = role === 'SUPER_ADMIN'
        ? API_CONFIG.ENDPOINTS.ALL_NOTIFICATIONS_SUPER
        : API_CONFIG.ENDPOINTS.ALL_NOTIFICATIONS_ADMIN;

    const res = await api.get(endpoint, { 
        params: { limit: 20, ...params }
    });
    return res.data;
};

export const fetchNotificationsByStatus = async (status, arg2 = {}, arg3 = {}) => {
    // Resilience for old signature: (status, role, params)
    const params = typeof arg2 === 'string' ? arg3 : arg2;
    const roleArg = typeof arg2 === 'string' ? arg2 : null;

    const res = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS_STATUS, {
        params: { ...params, status: status.toUpperCase(), role: roleArg, limit: 20 }
    });
    return res.data;
};

/**
 * Article Notifications (Post Notifications)
 */
export const fetchArticleNotifications = async (params = {}) => {
    const res = await api.get(API_CONFIG.ENDPOINTS.POST_NOTIFICATIONS, {
        params: { size: 20, ...params }
    });
    return res.data;
};

export const fetchArticleUnseenCount = async () => {
    const res = await api.get(API_CONFIG.ENDPOINTS.POST_UNSEEN_COUNT);
    return res.data;
};

export const markArticleSeen = async (id) => {
    const url = typeof API_CONFIG.ENDPOINTS.POST_MARK_SEEN === 'function'
        ? API_CONFIG.ENDPOINTS.POST_MARK_SEEN(id)
        : `post-notifications/${id}/seen`;
    return await api.patch(url);
};

export const sendPostNotification = async (postId, receiverRole, message) => {
    return await api.post(API_CONFIG.ENDPOINTS.SEND_NOTIFICATION, {
        postId,
        receiverRole,
        message
    });
};

/**
 * General Actions
 */
export const approveRequest = async (id) => {
    return await api.put(`/${id}/approve`, {});
};

export const rejectRequest = async (id, reason) => {
    return await api.put(`/${id}/reject`, { reason });
};

/**
 * Backward Compatibility Aliases (For legacy modules)
 */
export const fetchNotifications = fetchUnseenRoleNotifications;

export const markAsSeen = async (id) => {
    // Attempt role notification mark if numeric ID
    if (typeof id === 'number' || !isNaN(id)) {
        return await markRoleNotificationsSeen([id]);
    }
    // Fallback to article mark
    return await markArticleSeen(id);
};

export const markAllAsSeen = async (role) => {
    // Standard role-based bulk marking (if ids are available in context)
    // Note: Legacy callers didn't pass IDs, but the new backend requires them.
    // This alias is limited and ideally legacy components should be refactored.
    console.warn("markAllAsSeen called via legacy alias. This may not mark cross-role items without IDs.");
    return await api.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS_SEEN_ALL, null, { params: { role } });
};
