const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws',
    DJANGO_BASE_URL: import.meta.env.VITE_API_URL_DJANGO || 'http://localhost:8000/api/django',

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
        CREATE_YT_URLS: 'create-yt-urls',
        GET_YT_URLS_BY_CATEGORY: 'get-yt-urls-by-category',
        DELETE_YT_URLS: 'delete-yt-urls',
        EDIT_YT_URLS: 'edit-yt-urls',

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
        CURRENT_AFFAIRS_CURSOR: 'cms/articles/current-affairs/',
        ARTICLE_FILTERS: 'cms/articles/filters/',
        ARTICLE_CREATE: 'cms/articles/',

        // Taxonomy CMS (CONTRIBUTOR+)
        TAXONOMY_SECTIONS_CMS: 'cms/taxonomy/cms-sections/',
        TAXONOMY_SECTIONS_CREATE: 'cms/taxonomy/sections/create/',
        TAXONOMY_SECTION_DETAIL: (id) => `cms/taxonomy/sections/${id}/`,
        TAXONOMY_SECTION_DELETE: (id) => `cms/taxonomy/sections/${id}/delete/`,

        TAXONOMY_CATEGORIES_CMS: 'cms/taxonomy/categories/',
        TAXONOMY_CATEGORIES_CREATE: 'cms/taxonomy/categories/create/',
        TAXONOMY_CATEGORY_DETAIL: (id) => `cms/taxonomy/categories/${id}/`,
        TAXONOMY_CATEGORY_DELETE: (id) => `cms/taxonomy/categories/${id}/delete/`,
        TAXONOMY_CATEGORY_DISABLE: (id) => `cms/taxonomy/categories/${id}/disable/`,
        TAXONOMY_CATEGORY_ENABLE: (id) => `cms/taxonomy/categories/${id}/enable/`,

        // Taxonomy Public
        TAXONOMY_SECTIONS_PUBLIC: 'taxonomy/sections/',
        TAXONOMY_ROOT_CATEGORIES: (slug) => `taxonomy/${slug}/`,
        TAXONOMY_TREE: (slug) => `taxonomy/${slug}/tree/`,
        TAXONOMY_LEVELS: (slug) => `taxonomy/${slug}/levels/`,
        TAXONOMY_CHILDREN: (slug) => `taxonomy/${slug}/children/`,

        TOP_STORIES_CMS: 'cms/articles/top-stories-cms/',
        TOP_STORIES_PUBLIC: 'cms/articles/top-stories/list/',
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
