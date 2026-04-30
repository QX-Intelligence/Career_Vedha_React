import axios from 'axios';
import api, { getAccessToken } from './api';

const BASE = 'services'; // Translates to /api/spring/services/...

// Dedicated axios instance for file uploads — NO interceptors
const uploadClient = axios.create({
    baseURL: api.defaults.baseURL,
    timeout: 300000, // 5 minutes
});

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

    // Image Upload — Direct to S3 via Presigned URL (bypasses Nginx completely for maximum speed)
    uploadImage: async (file, onProgress) => {
        // 1. Get the Presigned URL from the backend
        const presignedRes = await api.get(`${BASE}/upload-presigned`, {
            params: {
                filename: file.name,
                contentType: file.type
            }
        });
        
        const { key, url: s3Url } = presignedRes.data;
        
        // 2. Upload directly to S3 URL using raw axios (no interceptors, no auth headers)
        await axios.put(s3Url, file, {
            headers: {
                'Content-Type': file.type
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload Progress: ${percentCompleted}% (${progressEvent.loaded} bytes of ${progressEvent.total})`);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            }
        });
        
        return { key, url: s3Url };
    },
    deleteImage: async (key) => (await api.delete(`${BASE}/file`, { params: { key } })).data,
};
