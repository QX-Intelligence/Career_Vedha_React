const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws',
    DJANGO_BASE_URL: import.meta.env.VITE_API_URL_DJANGO || 'http://localhost:8000/api',

    ENDPOINTS: {
        // News & Articles
        NEWS: 'news',
        FEATURED_NEWS: 'news/featured',
        LATEST_NEWS: 'news/latest',

        // Exams
        EXAMS: 'exams',
        EXAM_NOTIFICATIONS: 'exams/notifications',
        EXAM_RESULTS: 'exams/results',

        // Study Materials
        STUDY_MATERIALS: 'study-materials',
        PREVIOUS_PAPERS: 'previous-papers',

        // Current Affairs
        CURRENT_AFFAIRS: 'current-affairs',

        // Jobs
        JOBS: 'jobs',
        JOB_ALERTS: 'jobs/alerts',

        // Videos
        VIDEOS: 'videos',
        SHORTS: 'videos/shorts',

        // User
        NEWSLETTER_SUBSCRIBE: 'newsletter/subscribe',
        CONTACT: 'contact',

        // Search
        SEARCH: 'search',

        // Quiz / Exam Module
        GET_QUESTIONS: 'get-questions',
        SUBMIT_EXAM: 'submit-exam',
        POST_QUESTION: 'post-question',
        EDIT_QUESTION: 'edit-question',
        DELETE_QUESTION: 'delete-question',
        GET_RANDOM_QUESTIONS_BY_CHAPTER: 'questions-random-chapterid',
        GET_RANDOM_QUESTIONS_BY_CATEGORY: 'questions-random-category',
        GET_EXAM_CATEGORIES: 'get-exam-categories',
        CREATE_QUESTION: 'post-question',

        // Auth & Notifications (Synced with Controller.java)
        LOGOUT: 'log-out',
        NOTIFICATIONS_UNSEEN_ROLE: 'unseen-notifications-by-role',
        NOTIFICATIONS_SEEN_ALL: 'notifications-seen/-all',
        ALL_NOTIFICATIONS_SUPER: 'get-all-notifications',
        ALL_NOTIFICATIONS_ADMIN: 'get-all-notifcations-by-role',
        NOTIFICATIONS_STATUS: 'notifications-status',

        // Post Notifications (Articles)
        POST_NOTIFICATIONS: 'post-notifications',
        POST_UNSEEN_COUNT: 'post-unseen-count',
        SEND_NOTIFICATION: 'send-post-notification', // Added for frontend-triggered notifications
        POST_MARK_SEEN: (id) => `post-notifications/${id}/seen`,

        // User Management
        ACTIVE: 'get-active-users',
        INACTIVE: 'get-inactive-users',
        ALL: 'get-all-users',
        ACTIVATE: 'activate-user',
        INACTIVATE: 'inactivate-user',

        // Profile
        GET_PROFILE: 'get-logged-user-details',
        UPDATE_PROFILE: 'edit-loggedin-user-details',
    },

    DJANGO_ENDPOINTS: {
        HOME_ARTICLES: 'cms/articles/home/',
    },
    
    DJANGO_MEDIA_BASE_URL: import.meta.env.VITE_API_URL_DJANGO_MEDIA || 'http://localhost:8000/api',

    MEDIA: {
        UPLOAD: 'media/upload/',
        LIST: 'media/',
        PRESIGNED: 'media/', // + <id>/presigned/
        RESOLVE: 'media/', // + <id>/resolve/
        REPLACE: 'media/', // + <id>/replace/
        DELETE: 'media/', // + <id>/
    },

    // Request timeout in milliseconds (30 seconds for complex Django queries)
    TIMEOUT: 30000,

    // Headers
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

export default API_CONFIG;
