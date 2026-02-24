import axios from 'axios';
import API_CONFIG from '../config/api.config';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// In-Memory Storage
let _accessToken = null;
let _userRole = null;
let _userEmail = null;
let _userId = null;
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

export const setUserContext = (token, role, email, firstName = null, lastName = null, status = null, id = null) => {
    _accessToken = token;
    // Normalize role: remove ROLE_ prefix and convert to uppercase
    _userRole = role ? role.replace(/^ROLE_/, '').toUpperCase() : null;
    _userEmail = email;
    _userId = id || email; // Fallback to email if id is missing
    _firstName = firstName;
    _lastName = lastName;
    _userStatus = status;
    notifyListeners();
};

export const getUserContext = () => ({
    role: _userRole,
    email: _userEmail,
    id: _userId,
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

// Expose setUserContext for E2E tests in dev/test mode only
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    window.__e2eSetAuth = (token, role, email, firstName, lastName, status, id) => {
        setUserContext(token, role, email, firstName, lastName, status, id);
    };
    window.__e2eClearAuth = () => {
        setUserContext(null, null, null, null, null, null, null);
    };
}

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
                const { accessToken, role } = response.data;

                setUserContext(accessToken, role);

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
