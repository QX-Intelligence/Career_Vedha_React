import apiClient from './api.service';
import djangoApi from './djangoApi';
import API_CONFIG from '../config/api.config';
import { academicsService } from './academicsService';


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
    getArticleDetail: async (section, slug, lang = 'en') => {
        try {
            // If section is unknown, try direct slug fetch
            const url = (section && section !== 'null' && section !== 'N/A')
                ? `cms/articles/${section}/${slug}/`
                : `cms/articles/${slug}/`;

            const response = await djangoApi.get(url, {
                params: { lang }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching article detail for ${section}/${slug}:`, error);
            throw error;
        }
    },

    // Get Admin Article Detail (Full translations)
    getAdminArticleDetail: async (id) => {
        try {
            const response = await djangoApi.get(`cms/articles/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching admin article detail for ID ${id}:`, error);
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

            // Try the CMS prefixed URL
            const response = await djangoApi.get('cms/articles/home/', {
                params: { lang: langCode, limit, offset }
            });

            const data = response.data;

            // Resilience: Handle data as array [...] or object { featured: [...] }
            const featuredList = Array.isArray(data) ? data : (data.featured || []);
            const trendingList = Array.isArray(data) ? [] : (data.trending || []);
            const mustReadList = Array.isArray(data) ? [] : (data.must_read || []);
            const latestData = data.latest || (Array.isArray(data) ? { results: [] } : { results: [] });

            return {
                featured: featuredList,
                trending: trendingList,
                must_read: mustReadList,
                latest: latestData,
                // Direct mapping for UI widgets
                hero: (data.hero && data.hero.length > 0) ? data.hero : featuredList.slice(0, 5),
                top_stories: (data.top_stories && data.top_stories.length > 0) ? data.top_stories : featuredList.slice(5),
                breaking: (data.breaking && data.breaking.length > 0) ? data.breaking : featuredList.filter(a => (a.feature_type || a.type) === 'BREAKING'),
                must_read: (data.must_read && data.must_read.length > 0) ? data.must_read : mustReadList
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
            // Check if we have file uploads in any potential field
            const hasFiles = Object.values(articleData).some(val => val instanceof File);

            let payload = articleData;
            let headers = {};

            if (hasFiles) {
                // Convert to FormData for file upload
                const formData = new FormData();
                Object.keys(articleData).forEach(key => {
                    const value = articleData[key];
                    if (value !== null && value !== undefined) {
                        if (key === 'translations' && Array.isArray(value)) {
                            formData.append(key, JSON.stringify(value));
                        } else if (key === 'category_ids' && Array.isArray(value)) {
                            value.forEach(id => formData.append('category_ids', id));
                        } else if ((key === 'tags' || key === 'keywords') && Array.isArray(value)) {
                            value.forEach(item => formData.append(key, item));
                        } else {
                            formData.append(key, value);
                        }
                    }
                });
                payload = formData;
                // NOTE: Do NOT set Content-Type manually for FormData.
                // Axios + browser automatically add: multipart/form-data; boundary=----XYZ
                headers = {};
            } else {
                // If JSON, filter out null/undefined to satisfy strict backend validators
                payload = Object.fromEntries(
                    Object.entries(articleData).filter(([_, v]) => v !== null && v !== undefined)
                );
            }

            const response = await djangoApi.post('cms/articles/', payload, { headers });
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
            // Check if we have file uploads
            const hasFiles = Object.values(articleData).some(val => val instanceof File);

            let payload = articleData;
            let headers = {};

            if (hasFiles) {
                // Convert to FormData for file upload
                const formData = new FormData();
                Object.keys(articleData).forEach(key => {
                    const value = articleData[key];
                    if (value !== null && value !== undefined) {
                        if (key === 'category_ids' && Array.isArray(value)) {
                            value.forEach(id => formData.append('category_ids', id));
                        } else if ((key === 'tags' || key === 'keywords') && Array.isArray(value)) {
                            value.forEach(item => formData.append(key, item));
                        } else {
                            formData.append(key, value);
                        }
                    }
                });
                payload = formData;
                // NOTE: Do NOT set Content-Type manually for FormData.
                // Axios + browser automatically add: multipart/form-data; boundary=----XYZ
                headers = {};
            } else {
                // If JSON, filter out null/undefined
                payload = Object.fromEntries(
                    Object.entries(articleData).filter(([_, v]) => v !== null && v !== undefined)
                );
            }

            const response = await djangoApi.patch(`cms/articles/${articleId}/`, payload, { headers });
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
            const features = response.data.results || [];
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

    // 5e. Admin Direct Publish (Schedule)
    directPublish: async (articleId, data = {}) => {
        try {
            const response = await djangoApi.patch(`cms/articles/${articleId}/direct-publish/`, data);
            return response.data;
        } catch (error) {
            console.error('Error directly publishing article:', error);
            throw error;
        }
    },

    // 6. Admin List (For Management Table)
    getAdminArticles: async (params = {}) => {
        try {
            const response = await djangoApi.get('cms/articles/admin/list/', { params });
            // Return full paginated response for cursor support
            return response.data;
        } catch (error) {
            console.error('Error fetching admin articles:', error);
            return { results: [], next_cursor: null, has_next: false };
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

    getAdminCategories: async (params = {}) => {
        try {
            const response = await djangoApi.get('taxonomy/categories/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin categories:', error);
            return { results: [], next_cursor: null, has_next: false };
        }
    },

    createCategory: async (categoryData) => {
        try {
            const response = await djangoApi.post('taxonomy/categories/create/', categoryData);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            const response = await djangoApi.patch(`taxonomy/categories/${id}/`, categoryData);
            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const response = await djangoApi.delete(`taxonomy/categories/${id}/delete/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    disableCategory: async (id) => {
        try {
            const response = await djangoApi.patch(`taxonomy/categories/${id}/disable/`);
            return response.data;
        } catch (error) {
            console.error('Error disabling category:', error);
            throw error;
        }
    },

    enableCategory: async (id) => {
        try {
            const response = await djangoApi.patch(`taxonomy/categories/${id}/enable/`);
            return response.data;
        } catch (error) {
            console.error('Error enabling category:', error);
            throw error;
        }
    },

    getCategoryChildren: async (section, parentId) => {
        try {
            const response = await djangoApi.get(`taxonomy/${section}/children/`, {
                params: { parent_id: parentId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching category children for ${section}/${parentId}:`, error);
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
    },

    // Get public articles with cursor-based pagination
    getPublicArticles: async (params = {}) => {
        try {
            // Mapping for backend language codes
            if (params.lang) {
                params.lang = params.lang === 'telugu' ? 'te' : (params.lang === 'english' ? 'en' : params.lang);
            }

            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.PUBLISHED_ARTICLES, { params });
            // The published endpoint returns { results, next_cursor, has_next, limit } directly
            return response.data;
        } catch (error) {
            console.error('Error fetching public articles:', error);
            return { results: [], has_next: false, next_cursor: null };
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
    }
};

// Question Paper Service (Spring Boot)
export const questionPaperService = {
    // Get papers by category
    getPapersByCategory: async (category, cursor = null, limit = 10) => {
        try {
            const params = { category, limit };
            if (cursor) params.cursor = cursor;

            const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_PAPERS_BY_CATEGORY, { params });
            const data = response.data;
            // Handle different response formats (Raw Array vs Paginated Object)
            return Array.isArray(data) ? data : (data?.results || data?.data || data?.content || []);
        } catch (error) {
            console.error('Error fetching papers by category:', error);
            return [];
        }
    },

    // Bulk Create Papers (Multipart)
    createPapers: async (formData) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CREATE_PREV_PAPERS, formData);
            return response.data;
        } catch (error) {
            console.error('Error creating papers:', error);
            throw error;
        }
    },

    // Alias for bulk upload
    bulkUploadPapers: async (formData) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CREATE_PREV_PAPERS, formData);
            return response.data;
        } catch (error) {
            console.error('Error uploading papers:', error);
            throw error;
        }
    },

    // Delete Multiple Papers
    deletePapers: async (ids) => {
        try {
            const response = await apiClient.delete(API_CONFIG.ENDPOINTS.DELETE_PAPERS, { data: ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting papers:', error);
            throw error;
        }
    }
};

// Current Affairs Service (Spring Boot)
export const currentAffairsService = {
    // Get all current affairs with cursor pagination
    getAllAffairs: async (params = {}) => {
        try {
            // Ensure language is uppercase as required by backend
            const queryParams = {};

            // Only add parameters if they have values
            if (params.language) {
                let lang = params.language.toUpperCase();
                if (lang === 'TELUGU') lang = 'TE';
                if (lang === 'ENGLISH') lang = 'EN';
                queryParams.language = lang;
            }

            if (params.limit) queryParams.limit = params.limit;
            if (params.cursorTime) queryParams.cursorTime = params.cursorTime;
            if (params.cursorId) queryParams.cursorId = params.cursorId;

            const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_ALL_AFFAIRS, { params: queryParams });
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.data || data?.content || []);
        } catch (error) {
            console.error('Error fetching current affairs:', error);
            return [];
        }
    },

    // Get current affairs by region
    getByRegion: async (region, params = {}) => {
        try {
            const queryParams = { region: region.toUpperCase() };

            // Only add parameters if they have values
            if (params.language) {
                let lang = params.language.toUpperCase();
                if (lang === 'TELUGU') lang = 'TE';
                if (lang === 'ENGLISH') lang = 'EN';
                queryParams.language = lang;
            }

            if (params.limit) queryParams.limit = params.limit;
            if (params.cursorTime) queryParams.cursorTime = params.cursorTime;
            if (params.cursorId) queryParams.cursorId = params.cursorId;

            const response = await apiClient.get(API_CONFIG.ENDPOINTS.CURRENT_AFFAIRS_BY_REGION, { params: queryParams });
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.data || data?.content || []);
        } catch (error) {
            console.error(`Error fetching affairs for region ${region}:`, error);
            return [];
        }
    },

    // Create Current Affairs (Multipart)
    // Backend expects lists for bulk creation: List<String> title, List<String> summary, etc.
    createCurrentAffairs: async (data) => {
        try {
            let payload = data;

            // If data is not already FormData, construct it
            if (!(data instanceof FormData)) {
                const formData = new FormData();
                const items = Array.isArray(data) ? data : [data];

                items.forEach((item) => {
                    formData.append('title', item.title || '');
                    formData.append('region', item.region || 'INDIA');

                    // Normalize and append language
                    let lang = (item.language || 'TE').toUpperCase();
                    if (lang === 'TELUGU') lang = 'TE';
                    if (lang === 'ENGLISH') lang = 'EN';
                    formData.append('language', lang);

                    // Optional but expected fields (always append to avoid backend index issues)
                    formData.append('summary', item.summary || '');
                    formData.append('description', item.description || '');

                    if (item.file) {
                        formData.append('file', item.file);
                    }
                });
                payload = formData;
            }

            // NOTE: Do NOT set Content-Type header manually for FormData
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CREATE_CURRENT_AFFAIRS, payload);
            return response.data;
        } catch (error) {
            console.error('Error creating current affairs:', error);
            throw error;
        }
    },

    // Update Current Affair (Multipart)
    // Backend expects single values: String title, String summary, String description, String region, MultipartFile file
    updateCurrentAffair: async (id, data) => {
        try {
            let payload = data;

            if (!(data instanceof FormData)) {
                const formData = new FormData();
                formData.append('title', data.title || '');
                formData.append('region', data.region || 'INDIA');
                formData.append('summary', data.summary || '');
                formData.append('description', data.description || '');

                if (data.file) {
                    formData.append('file', data.file);
                }
                payload = formData;
            } else {
                // If it is FormData, ensure language is NOT present (backend update doesn't take it)
                if (payload.has('language')) {
                    payload.delete('language');
                }
            }

            const response = await apiClient.put(API_CONFIG.ENDPOINTS.UPDATE_CURRENT_AFFAIR(id), payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating current affair ${id}:`, error);
            throw error;
        }
    },

    // Delete Current Affair
    deleteCurrentAffair: async (id) => {
        try {
            const response = await apiClient.delete(API_CONFIG.ENDPOINTS.DELETE_CURRENT_AFFAIR(id));
            return response.data;
        } catch (error) {
            console.error(`Error deleting current affair ${id}:`, error);
            throw error;
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

// Contact Service
export const contactService = {
    // Submit contact form
    submitContact: async (contactData) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CONTACT_SUBMIT, contactData);
            return response.data;
        } catch (error) {
            console.error('Error submitting contact form:', error);
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
            })
                ;
        } catch (error) {
            console.error('Error searching:', error);
            return { data: [] };
        }
    }
};

// Export academicsService
export { academicsService };

// Taxonomy Service
export const taxonomyService = {
    getSections: async () => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS);
            return response.data;
        } catch (error) {
            console.error('Error fetching taxonomy sections:', error);
            return [];
        }
    }
};

// Global Search Service (Aggregates results from multiple sources)
export const globalSearchService = {
    searchAll: async (query, types = ['all']) => {
        if (!query || query.trim().length < 2) {
            return { results: [], totalResults: 0, resultsByType: {} };
        }

        const searchQuery = query.trim();
        const promises = [];
        const resultMap = {
            articles: [],
            jobs: [],
            papers: [],
            currentAffairs: []
        };

        try {
            // Search Articles (if type includes 'all' or 'article')
            if (types.includes('all') || types.includes('article')) {
                promises.push(
                    djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.PUBLISHED_ARTICLES, {
                        params: {
                            limit: 100
                        }
                    })
                        .then(res => {
                            const allArticles = (res.data.results || []);
                            resultMap.articles = allArticles
                                .filter(article => {
                                    const searchTerm = searchQuery.toLowerCase();
                                    return (
                                        (article.headline || '').toLowerCase().includes(searchTerm) ||
                                        (article.title || '').toLowerCase().includes(searchTerm) ||
                                        (article.summary || '').toLowerCase().includes(searchTerm)
                                    );
                                })
                                .map(article => ({
                                    type: 'article',
                                    id: article.id,
                                    title: article.headline || article.title,
                                    summary: article.summary,
                                    url: `/${article.section}/${article.slug}`,
                                    publishedAt: article.published_at,
                                    image: article.banner_media?.url,
                                    section: article.section
                                }));
                        })
                        .catch(err => console.error('Article search error:', err))
                );
            }

            // Search Jobs (if type includes 'all' or 'jobs')
            if (types.includes('all') || types.includes('jobs')) {
                promises.push(
                    djangoApi.get('jobs/', {
                        params: { limit: 100 }
                    })
                        .then(res => {
                            const allJobs = res.data?.results || res.data || [];
                            resultMap.jobs = allJobs
                                .filter(job => {
                                    const searchTerm = searchQuery.toLowerCase();
                                    return (
                                        (job.title || '').toLowerCase().includes(searchTerm) ||
                                        (job.company || '').toLowerCase().includes(searchTerm) ||
                                        (job.location || '').toLowerCase().includes(searchTerm) ||
                                        (job.description || '').toLowerCase().includes(searchTerm)
                                    );
                                })
                                .map(job => ({
                                    type: 'job',
                                    id: job.id,
                                    title: job.title,
                                    company: job.company,
                                    location: job.location,
                                    url: `/jobs/${job.id}`,
                                    postedAt: job.posted_at || job.created_at
                                }));
                        })
                        .catch(err => console.error('Jobs search error:', err))
                );
            }

            // Search Papers
            if (types.includes('all') || types.includes('papers')) {
                promises.push(
                    questionPaperService.getPapersByCategory('QUESTIONPAPER', null, 50)
                        .then(papers => {
                            resultMap.papers = papers
                                .filter(p =>
                                    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 10)
                                .map(paper => ({
                                    type: 'paper',
                                    id: paper.id,
                                    title: paper.title,
                                    description: paper.description,
                                    url: paper.presignedUrl,
                                    category: paper.category,
                                    createdAt: paper.creationDate
                                }));
                        })
                        .catch(err => console.error('Papers search error:', err))
                );
            }

            // Search Current Affairs
            if (types.includes('all') || types.includes('currentAffairs')) {
                promises.push(
                    currentAffairsService.getAllAffairs({ limit: 50 })
                        .then(affairs => {
                            const results = affairs || [];
                            resultMap.currentAffairs = results
                                .filter(ca =>
                                    ca.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    ca.summary?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 10)
                                .map(ca => ({
                                    type: 'currentAffair',
                                    id: ca.id,
                                    title: ca.title,
                                    summary: ca.summary,
                                    url: `/current-affairs/${ca.id}`,
                                    language: ca.language,
                                    createdAt: ca.createdAt
                                }));
                        })
                        .catch(err => console.error('Current affairs search error:', err))
                );
            }

            await Promise.all(promises);

            // Combine all results
            const allResults = [
                ...resultMap.articles,
                ...resultMap.jobs,
                ...resultMap.papers,
                ...resultMap.currentAffairs
            ];

            return {
                query: searchQuery,
                results: allResults,
                totalResults: allResults.length,
                resultsByType: {
                    articles: resultMap.articles.length,
                    jobs: resultMap.jobs.length,
                    papers: resultMap.papers.length,
                    currentAffairs: resultMap.currentAffairs.length
                }
            };
        } catch (error) {
            console.error('Global search error:', error);
            return {
                query: searchQuery,
                results: [],
                totalResults: 0,
                resultsByType: {}
            };
        }
    }
};
