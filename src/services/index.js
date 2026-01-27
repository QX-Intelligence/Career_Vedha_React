import apiClient from './api.service';
import djangoApi from './djangoApi';
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
            console.error('Error fetching latest articles:', error);
            return { results: [], has_next: false };
        }
    },

    // Get Single Article Details
    getArticleDetail: async (section, slug, lang = 'te') => {
        try {
            // Correct URL structure: /api/cms/articles/<section>/<slug>/
            const response = await djangoApi.get(`cms/articles/${section}/${slug}/`, {
                params: { lang }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching article detail for ${section}/${slug}:`, error);
            throw error;
        }
    },
    // Get Latest Articles with corrected pagination and language
    getLatestArticles: async (lang = 'te', limit = 20, offset = 0) => {
        try {
            const params = { lang, limit, offset };

            const response = await djangoApi.get('cms/articles/home/', { params });
            return response.data.latest || { results: [], has_next: false };
        } catch (error) {
            console.error('Error fetching latest articles:', error);
            return { results: [], has_next: false };
        }
    },
    // Get Django Home Articles
    getHomeContent: async (lang = 'te', limit = 20, offset = 0) => {
        try {
            const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

            // Try the CMS prefixed URL first
            let response;
            try {
                response = await djangoApi.get('cms/articles/home/', {
                    params: { lang: langCode, limit, offset }
                });
            } catch (err) {
                // Fallback to non-CMS prefixed public URL if CMS one fails
                response = await djangoApi.get('articles/home/', {
                    params: { lang: langCode, limit, offset }
                });
            }

            const data = response.data;

            // Resilience: Handle data as array [...] or object { featured: [...] }
            const featuredList = Array.isArray(data) ? data : (data.featured || []);
            const trendingList = Array.isArray(data) ? [] : (data.trending || []);
            const latestData = data.latest || (Array.isArray(data) ? { results: [] } : { results: [] });

            return {
                featured: featuredList,
                trending: trendingList,
                latest: latestData,
                // Direct mapping for UI widgets
                hero: featuredList.slice(0, 5),
                top_stories: featuredList.slice(5),
                breaking: featuredList.filter(a => (a.feature_type || a.type) === 'BREAKING')
            };
        } catch (error) {
            console.warn(`[newsService] Home Feed (${lang}) fetch failed totally.`, error.message);
            return { featured: [], trending: [], latest: { results: [] }, hero: [], breaking: [], top_stories: [] };
        }
    },

    // CMS Management Methods (Protected)

    // 1. Create Article (DRAFT)
    createArticle: async (articleData) => {
        try {
            const response = await djangoApi.post('cms/articles/', articleData);
            return response.data;
        } catch (error) {
            console.error('Error creating article:', error);
            throw error;
        }
    },

    // 2. Add/Update Translation
    updateTranslation: async (articleId, translationData) => {
        try {
            const response = await djangoApi.post(`cms/articles/${articleId}/translation/`, translationData);
            return response.data;
        } catch (error) {
            console.error('Error updating translation:', error);
            throw error;
        }
    },

    // 2b. Update Full Article
    updateArticle: async (articleId, articleData) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/`, articleData);
            return response.data;
        } catch (error) {
            console.error('Error updating article:', error);
            throw error;
        }
    },

    // 2c. Pin Title to Feature (Hero, Top, Breaking, Editor Pick)
    pinArticle: async (id, data) => {
        try {
            const response = await djangoApi.post(`cms/articles/${id}/feature/`, data);
            return response.data;
        } catch (error) {
            console.error('Error pinning article:', error);
            throw error;
        }
    },

    // 2d. Unpin Title from Feature
    unpinArticle: async (id, params) => {
        try {
            // Ensure feature_type is uppercase as backend expects
            const cleanedParams = {
                ...params,
                feature_type: params.feature_type?.toUpperCase()
            };
            const response = await djangoApi.delete(`cms/articles/${id}/feature/remove/`, { params: cleanedParams });
            return response.data;
        } catch (error) {
            console.error('Error unpinning article:', error);
            throw error;
        }
    },

    // 2e. Get list of pinned/featured articles
    getPinnedArticles: async (params = {}) => {
        try {
            const response = await djangoApi.get('cms/articles/features/', { params });
            const featureType = response.data.feature_type;
            const features = response.data.features || [];
            // Inject feature_type into each item since backend puts it at root
            return features.map(f => ({ ...f, feature_type: featureType }));
        } catch (error) {
            console.error('Error fetching pinned articles:', error);
            return [];
        }
    },

    // 3. Assign Categories
    assignCategories: async (articleId, categoryIds) => {
        try {
            const response = await djangoApi.post(`cms/articles/${articleId}/categories/`, {
                category_ids: categoryIds
            });
            return response.data;
        } catch (error) {
            console.error('Error assigning categories:', error);
            throw error;
        }
    },

    // 4. Move to Review
    moveToReview: async (articleId) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/review/`);
            return response.data;
        } catch (error) {
            console.error('Error moving to review:', error);
            throw error;
        }
    },

    // 5. Publish Article
    publishArticle: async (articleId) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/publish/`);
            return response.data;
        } catch (error) {
            console.error('Error publishing article:', error);
            throw error;
        }
    },

    // 5b. Deactivate Article
    deactivateArticle: async (articleId) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/deactivate/`);
            return response.data;
        } catch (error) {
            console.error('Error deactivating article:', error);
            throw error;
        }
    },

    // 5d. Activate Article
    activateArticle: async (articleId) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/activate/`);
            return response.data;
        } catch (error) {
            console.error('Error activating article:', error);
            throw error;
        }
    },

    // 5c. Delete Article
    deleteArticle: async (articleId) => {
        try {
            const response = await djangoApi.delete(`cms/articles/${articleId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    },

    // 6. Admin List (For Management Table)
    getAdminArticles: async () => {
        try {
            const response = await djangoApi.get('cms/articles/admin/list/');
            // Handle both direct array and paginated { results: [] } formats
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching admin articles:', error);
            return [];
        }
    },

    // 6b. Search Articles (Admin/Editor)
    searchArticles: async (query) => {
        try {
            const response = await djangoApi.get('cms/articles/search/', {
                params: { q: query }
            });
            return response.data.results;
        } catch (error) {
            console.error('Error searching articles:', error);
            return [];
        }
    },

    // 7. Taxonomy / Categories
    getTaxonomyBySection: async (section) => {
        try {
            const response = await djangoApi.get(`taxonomy/${section}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy for ${section}:`, error);
            return [];
        }
    },

    getTaxonomyTree: async (section) => {
        try {
            const response = await djangoApi.get(`taxonomy/${section}/tree/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy tree for ${section}:`, error);
            return [];
        }
    },

    // 8. Public Feeds & Analytics
    getCategoryBlocks: async (section, lang = 'te', limit = 6) => {
        try {
            const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);
            const response = await djangoApi.get('cms/articles/category-block/', {
                params: { section, lang: langCode, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching category blocks:', error);
            return { section, blocks: [] };
        }
    },

    getTrendingArticles: async (params = {}) => {
        try {
            if (params.lang) {
                params.lang = params.lang === 'telugu' ? 'te' : (params.lang === 'english' ? 'en' : params.lang);
            }
            const response = await djangoApi.get('cms/articles/trending/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching trending articles:', error);
            return { results: [] };
        }
    },

    getSearchSuggestions: async (q, section, lang = 'te') => {
        try {
            const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);
            const response = await djangoApi.get('cms/articles/search-suggestions/', {
                params: { q, section, lang: langCode }
            });
            return response.data.suggestions;
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            return [];
        }
    },

    trackView: async (section, slug) => {
        try {
            const response = await djangoApi.post(`cms/articles/${section}/${slug}/track-view/`);
            return response.data;
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    },

    getSectionFeed: async (section, lang = 'te') => {
        try {
            const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);
            const response = await djangoApi.get(`cms/articles/section/${section}/`, {
                params: { lang: langCode }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching section feed for ${section}:`, error);
            return null;
        }
    },

    getArticleFilters: async (section) => {
        try {
            const response = await djangoApi.get('cms/articles/filters/', { params: { section } });
            return response.data;
        } catch (error) {
            console.error('Error fetching article filters:', error);
            return { total_published: 0, top_categories: [] };
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
// Jobs Service
export { jobsService } from './jobsService';

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
