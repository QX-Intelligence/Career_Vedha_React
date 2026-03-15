import axios from 'axios';
import { getAccessToken, setUserContext } from '../../../services/api';

const API_BASE = import.meta.env.VITE_API_URL_INVENTORY || '';
const MAIN_API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

let isRefreshing = false;
let failedQueue = [];


const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const inventoryApi = axios.create({
    baseURL: API_BASE ? (API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`) : '',
    withCredentials: true,
    timeout: 30000,
});

// Request Interceptor for Auth
inventoryApi.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for Token Refresh
inventoryApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return inventoryApi(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${MAIN_API_BASE.endsWith('/') ? MAIN_API_BASE : MAIN_API_BASE + '/'}refresh`, {}, { withCredentials: true });
                const { accessToken, role } = response.data;

                setUserContext(accessToken, role);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return inventoryApi(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setUserContext(null, null, null);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default inventoryApi;
