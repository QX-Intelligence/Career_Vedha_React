const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL,

    ENDPOINTS: {
        // News & Articles
        NEWS: '/news',
        FEATURED_NEWS: '/news/featured',
        LATEST_NEWS: '/news/latest',

        // Exams
        EXAMS: '/exams',
        EXAM_NOTIFICATIONS: '/exams/notifications',
        EXAM_RESULTS: '/exams/results',

        // Study Materials
        STUDY_MATERIALS: '/study-materials',
        PREVIOUS_PAPERS: '/previous-papers',

        // Current Affairs
        CURRENT_AFFAIRS: '/current-affairs',

        // Jobs
        JOBS: '/jobs',
        JOB_ALERTS: '/jobs/alerts',

        // Videos
        VIDEOS: '/videos',
        SHORTS: '/videos/shorts',

        // User
        NEWSLETTER_SUBSCRIBE: '/newsletter/subscribe',
        CONTACT: '/contact',

        // Search
        SEARCH: '/search',

        // Quiz / Exam Module
        GET_QUESTIONS: '/get-questions',
        SUBMIT_EXAM: '/submit-exam',
        POST_QUESTION: '/post-question',
        EDIT_QUESTION: '/edit-question',
        DELETE_QUESTION: '/delete-question',

        // Auth & Notifications (Synced with Controller.java)
        LOGOUT: '/log-out',
        MARK_ALL_SEEN: '/seen-all',
        ALL_NOTIFICATIONS_SUPER: '/get-all-notifications',
        ALL_NOTIFICATIONS_ADMIN: '/get-all-notifcations-by-role',
        NOTIFICATIONS_STATUS: '/notifications-status',

        // User Management
        ACTIVE: '/get-active-users',
        INACTIVE: '/get-inactive-users',
        ALL: '/get-all-users',
        SEARCH: '/search',
        ACTIVATE: '/activate-user',
        INACTIVATE: '/inactivate-user',

        // Profile
        GET_PROFILE: '/get-logged-user-details',
        UPDATE_PROFILE: '/edit-loggedin-user-details'
    },

    // Request timeout in milliseconds
    TIMEOUT: 10000,

    // Headers
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

export default API_CONFIG;
