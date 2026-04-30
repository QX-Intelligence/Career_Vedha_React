import api, { getAccessToken } from './api';

const BASE = 'services'; // Translates to /api/spring/services/...

export const ourServicesService = {
    getAll: async (cursor = null, size = 5) => {
        const params = {};
        if (cursor) params.cursor = cursor;
        if (size) params.size = size;
        return (await api.get(`${BASE}/get-all`, { params })).data;
    },
    getById: async (id) => (await api.get(`${BASE}/get/${id}`)).data,
    create: async (payload) => (await api.post(`${BASE}/create-service`, payload)).data,
    update: async (id, payload) => (await api.put(`${BASE}/${id}`, payload)).data,
    delete: async (id) => (await api.delete(`${BASE}/${id}`)).data,

    // Image Upload — uses native fetch to bypass all axios interceptors
    uploadImage: async (file) => {
        const fd = new FormData();
        fd.append('file', file);

        const token = getAccessToken();
        const baseURL = api.defaults.baseURL;
        const url = `${baseURL}${BASE}/upload`;

        const res = await fetch(url, {
            method: 'POST',
            body: fd,
            credentials: 'include',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                // DO NOT set Content-Type — browser auto-generates multipart boundary
            },
        });

        if (!res.ok) {
            let errorData;
            try { errorData = await res.json(); } catch (e) { /* not JSON */ }
            const msg = errorData?.message || errorData?.error || `Upload failed (${res.status})`;
            throw new Error(msg);
        }

        return await res.text(); // S3 key is returned as plain text
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};
