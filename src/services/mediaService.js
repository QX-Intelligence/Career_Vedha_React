import axios from 'axios';
import API_CONFIG from '../config/api.config';
import { getAccessToken } from './api';

// Specific axios instance for Media Service since it might use a different port (8001)
const mediaApi = axios.create({
    baseURL: API_CONFIG.DJANGO_MEDIA_BASE_URL.endsWith('/') 
        ? API_CONFIG.DJANGO_MEDIA_BASE_URL 
        : `${API_CONFIG.DJANGO_MEDIA_BASE_URL}/`,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

// Request Interceptor to attach JWT
mediaApi.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
mediaApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Media API Error:', error);
        return Promise.reject(error);
    }
);

const mediaService = {
    upload: async (formData) => {
        const response = await mediaApi.post(API_CONFIG.MEDIA.UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    list: async (params = {}) => {
        // params: { purpose, section, page, page_size }
        const response = await mediaApi.get(API_CONFIG.MEDIA.LIST, { params });
        // Backend returns paginated response: { count, next, previous, results }
        return response.data;
    },

    getPresigned: async (id) => {
        const response = await mediaApi.get(`${API_CONFIG.MEDIA.PRESIGNED}${id}/presigned/`);
        return response.data;
    },

    resolve: async (id) => {
        const response = await mediaApi.get(`${API_CONFIG.MEDIA.RESOLVE}${id}/resolve/`);
        return response.data;
    },

    replace: async (id, formData) => {
        const response = await mediaApi.patch(`${API_CONFIG.MEDIA.REPLACE}${id}/replace/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await mediaApi.delete(`${API_CONFIG.MEDIA.DELETE}${id}/`);
        return response.data;
    }
};

export default mediaService;
