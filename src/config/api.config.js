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
        CREATE_PREV_PAPERS: 'create-prev-papers/materials',
        GET_PAPERS_BY_CATEGORY: 'get-papers/bycategory',
        DELETE_PAPERS: 'delete-papers',
        ACADEMICS_HIERARCHY: 'internal/academics/hierarchy',

        // Current Affairs (Spring Boot)
        CREATE_CURRENT_AFFAIRS: 'current-affairs',
        GET_ALL_AFFAIRS: 'get-all-affairs',
        UPDATE_CURRENT_AFFAIR: (id) => `update-ca/${id}`,
        DELETE_CURRENT_AFFAIR: (id) => `delete-ca/${id}`,
        CURRENT_AFFAIRS_BY_REGION: 'current-affairs/by-region',

        // Jobs
        JOBS: 'jobs',
        JOB_ALERTS: 'jobs/alerts',

        // Videos
        VIDEOS: 'videos',
        SHORTS: 'videos/shorts',

        // User
        NEWSLETTER_SUBSCRIBE: 'newsletter/subscribe',
        CONTACT: 'contact',
        CONTACT_SUBMIT: 'contact',

        // Search
        SEARCH: 'search',

        // Quiz / Exam Module
        SUBMIT_EXAM: 'submit-exam',
        CREATE_QUESTION: 'post-question',
        EDIT_QUESTION: 'edit-question',
        DELETE_QUESTION: 'delete-question',
        GET_RANDOM_QUESTIONS_BY_CHAPTER: 'questions-random-chapterid',
        GET_RANDOM_QUESTIONS_BY_CATEGORY: 'questions-random-category',
        GET_EXAM_CATEGORIES: 'get-exam-categories',

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

        POST_MARK_SEEN: (id) => `post-notifications/${id}/seen`,
        POST_RESET_UNSEEN: 'reset-unseen',

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
        PUBLISHED_ARTICLES: 'cms/articles/published/',
        TAXONOMY_SECTIONS: 'taxonomy/sections/',
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

    // NOTE: Do NOT define a global Content-Type header here.
    // For JSON requests, axios sets it automatically.
    // For multipart/FormData requests, the browser must set it (with boundary) — never override manually.
    HEADERS: {}
};

export default API_CONFIG;
