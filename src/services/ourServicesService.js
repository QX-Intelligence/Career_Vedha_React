import api from './api';

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
    
    // Image Uploads via editor
    uploadImage: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return (await api.post(`${BASE}/upload`, fd)).data;
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};
