import axios from 'axios';
import API_CONFIG from '../config/api.config';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// In-Memory Storage
let _accessToken = null;
let _userRole = null;
let _userEmail = null;
let _firstName = null;
let _lastName = null;
let _userStatus = null;

let isRefreshing = false;
let failedQueue = [];

const api = axios.create({
    baseURL: API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`,
    withCredentials: true,
    timeout: 30000, // Increased default to 30s
});

export const setUserContext = (token, role, email, firstName = null, lastName = null, status = null) => {
    _accessToken = token;
    _userRole = role;
    _userEmail = email;
    _firstName = firstName;
    _lastName = lastName;
    _userStatus = status;
    notifyListeners();
};

export const getUserContext = () => ({
    role: _userRole,
    email: _userEmail,
    firstName: _firstName,
    lastName: _lastName,
    status: _userStatus,
    isAuthenticated: !!_accessToken
});

export const getAccessToken = () => _accessToken;

// Simple Subscription Mechanism
const listeners = new Set();

export const subscribeToAuthChanges = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const notifyListeners = () => {
    const context = getUserContext();
    listeners.forEach(cb => cb(context));
};

export const updateUserNames = (firstName, lastName) => {
    _firstName = firstName;
    _lastName = lastName;
    notifyListeners();
};

export const updateUserStatus = (status) => {
    _userStatus = status;
    notifyListeners();
};

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

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers.Authorization = `Bearer ${_accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${API_BASE}/refresh`, {}, { withCredentials: true });
                const { accessToken, role, email, firstName, lastName, status } = response.data;

                setUserContext(accessToken, role, email, firstName, lastName, status);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setUserContext(null, null, null);
                window.location.href = '/admin-login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
