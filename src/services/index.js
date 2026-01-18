import apiClient from './api.service';
import API_CONFIG from '../config/api.config';

// News Service
export const newsService = {
    // Get all news
    getAllNews: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.NEWS, { params });
        } catch (error) {
            console.error('Error fetching news:', error);
            return { data: [] };
        }
    },

    // Get featured news
    getFeaturedNews: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.FEATURED_NEWS);
        } catch (error) {
            console.error('Error fetching featured news:', error);
            return { data: null };
        }
    },

    // Get latest news
    getLatestNews: async (limit = 10) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.LATEST_NEWS, {
                params: { limit }
            });
        } catch (error) {
            console.error('Error fetching latest news:', error);
            return { data: [] };
        }
    }
};

// Exam Service
export const examService = {
    // Get all exams
    getAllExams: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.EXAMS);
        } catch (error) {
            console.error('Error fetching exams:', error);
            return { data: [] };
        }
    },

    // Get exam notifications
    getNotifications: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.EXAM_NOTIFICATIONS);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { data: [] };
        }
    },

    // Get exam results
    getResults: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.EXAM_RESULTS);
        } catch (error) {
            console.error('Error fetching results:', error);
            return { data: [] };
        }
    }
};

// Study Materials Service
export const studyMaterialService = {
    // Get study materials
    getMaterials: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.STUDY_MATERIALS, { params });
        } catch (error) {
            console.error('Error fetching study materials:', error);
            return { data: [] };
        }
    },

    // Get previous papers
    getPreviousPapers: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.PREVIOUS_PAPERS, { params });
        } catch (error) {
            console.error('Error fetching previous papers:', error);
            return { data: [] };
        }
    }
};

// Current Affairs Service
export const currentAffairsService = {
    // Get current affairs
    getCurrentAffairs: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.CURRENT_AFFAIRS, { params });
        } catch (error) {
            console.error('Error fetching current affairs:', error);
            return { data: [] };
        }
    }
};

// Jobs Service
export const jobsService = {
    // Get all jobs
    getAllJobs: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.JOBS, { params });
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return { data: [] };
        }
    },

    // Get job alerts
    getJobAlerts: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.JOB_ALERTS);
        } catch (error) {
            console.error('Error fetching job alerts:', error);
            return { data: [] };
        }
    }
};

// Videos Service
export const videosService = {
    // Get all videos
    getAllVideos: async (params = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.VIDEOS, { params });
        } catch (error) {
            console.error('Error fetching videos:', error);
            return { data: [] };
        }
    },

    // Get shorts
    getShorts: async () => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.SHORTS);
        } catch (error) {
            console.error('Error fetching shorts:', error);
            return { data: [] };
        }
    }
};

// Newsletter Service
export const newsletterService = {
    // Subscribe to newsletter
    subscribe: async (email) => {
        try {
            return await apiClient.post(API_CONFIG.ENDPOINTS.NEWSLETTER_SUBSCRIBE, { email });
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            throw error;
        }
    }
};

// Search Service
export const searchService = {
    // Search content
    search: async (query, filters = {}) => {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.SEARCH, {
                params: { q: query, ...filters }
            });
        } catch (error) {
            console.error('Error searching:', error);
            return { data: [] };
        }
    }
};
