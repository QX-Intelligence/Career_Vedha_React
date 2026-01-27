import axios from 'axios';
import API_CONFIG from '../config/api.config';

import { getAccessToken } from './api';

const djangoApi = axios.create({
    baseURL: API_CONFIG.DJANGO_BASE_URL.endsWith('/') ? API_CONFIG.DJANGO_BASE_URL : `${API_CONFIG.DJANGO_BASE_URL}/`,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

// Request Interceptor to attach JWT
djangoApi.interceptors.request.use(
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
djangoApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Django API Error:', error);
        return Promise.reject(error);
    }
);

export default djangoApi;
