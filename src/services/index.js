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
    // Get Published Articles (Public) - cursor pagination + section/lang/search support
    getPublicArticles: async (params = {}) => {
        try {
            // Mapping for backend language codes
            if (params.lang) {
                params.lang = params.lang === 'telugu' ? 'te' : (params.lang === 'english' ? 'en' : params.lang);
            }

            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
            );

            // Use specialized taxonomy filters if hierarchical params are present
            // Handle both 'level' (legacy) and 'category' (standard)
            const hasHierarchy = cleanParams.section || cleanParams.category || cleanParams.level || cleanParams.sub_category || cleanParams.sub || cleanParams.segment;
            
            const endpoint = hasHierarchy
                ? API_CONFIG.DJANGO_ENDPOINTS.ARTICLE_FILTERS
                : API_CONFIG.DJANGO_ENDPOINTS.PUBLISHED_ARTICLES;

            // Map frontend params to backend expected names if needed
            const backendParams = { ...cleanParams };
            if (cleanParams.level && !cleanParams.category) backendParams.category = cleanParams.level;
            if (cleanParams.sub && !cleanParams.sub_category) backendParams.sub_category = cleanParams.sub;

            const response = await djangoApi.get(endpoint, { params: backendParams });
            const data = response.data;

            // Handle different response formats (Article Filters endpoint returns { articles, total_published })
            const results = data.articles || data.results || (Array.isArray(data) ? data : []);
            
            return {
                ...data, // Include total_published, top_categories etc from backend
                results: results,
                total: data.total_published || data.count || results.length,
                // Robust cursor extraction
                next_cursor: data.next_cursor || data.next || null,
                has_next: data.has_next || !!(data.next_cursor || data.next),
                categoryInfo: data.category || null // Pass back the resolved category info if available
            };
        } catch (error) {
            console.error('Error fetching public articles:', error);
            return { results: [], next_cursor: null, has_next: false, total: 0 };
        }
    },

    // Get Articles for Admin Management (protected)
    getAdminArticles: async (params = {}) => {
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
            );
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.ARTICLE_CREATE, { params: cleanParams });
            const data = response.data;
            if (Array.isArray(data)) {
                return { results: data, count: data.length };
            }
            return data;
        } catch (error) {
            console.error('Error fetching admin articles:', error);
            return { results: [], count: 0 };
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
    getLatestArticles: async (lang = 'en', limit = 20, offset = 0) => {
        const params = { lang, limit, offset };
        const response = await djangoApi.get('cms/articles/home/', { params });
        return response.data.latest || { results: [], has_next: false };
    },
    // Get Django Home Articles
    getHomeContent: async (lang = 'en', limit = 20, offset = 0) => {
        const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

        const [response, topStoriesResponse] = await Promise.all([
            djangoApi.get('cms/articles/home/', {
                params: { lang: langCode, limit, offset }
            }),
            djangoApi.get('cms/articles/top-stories/list/', { params: { limit: 10 } }).catch(() => ({ data: { results: [] } }))
        ]);

        const data = response.data;
        const cmsTopStories = topStoriesResponse.data.results || [];

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
            top_stories: cmsTopStories.length > 0 ? cmsTopStories : ((data.top_stories && data.top_stories.length > 0) ? data.top_stories : featuredList.slice(5)),
            breaking: (data.breaking && data.breaking.length > 0) ? data.breaking : featuredList.filter(a => (a.feature_type || a.type) === 'BREAKING'),
            must_read: (data.must_read && data.must_read.length > 0) ? data.must_read : mustReadList
        };
    },

    // CMS Management Methods (Protected)

    // 1. Create Article (DRAFT)
    createArticle: async (articleData) => {
        try {
            let payload = articleData;
            let headers = {};

            if (articleData instanceof FormData) {
                payload = articleData;
                // Don't set Content-Type, let axios/browser handle boundary
            } else {
                // Check if we have file uploads in any potential field
                const hasFiles = Object.values(articleData).some(val => val instanceof File);

                if (hasFiles) {
                    const formData = new FormData();
                    Object.keys(articleData).forEach(key => {
                        const value = articleData[key];
                        if (value !== null && value !== undefined) {
                            if (Array.isArray(value)) {
                                value.forEach(item => formData.append(key, item));
                            } else {
                                formData.append(key, value);
                            }
                        }
                    });
                    payload = formData;
                } else {
                    payload = Object.fromEntries(
                        Object.entries(articleData).filter(([_, v]) => v !== null && v !== undefined)
                    );
                }
            }

            const response = await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.ARTICLE_CREATE, payload, { headers });
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
            let payload = articleData;
            let headers = {};

            if (articleData instanceof FormData) {
                payload = articleData;
            } else {
                // Check if we have file uploads
                const hasFiles = Object.values(articleData).some(val => val instanceof File);

                if (hasFiles) {
                    const formData = new FormData();
                    Object.keys(articleData).forEach(key => {
                        const value = articleData[key];
                        if (value !== null && value !== undefined) {
                            if (Array.isArray(value)) {
                                value.forEach(item => formData.append(key, item));
                            } else {
                                formData.append(key, value);
                            }
                        }
                    });
                    payload = formData;
                } else {
                    payload = Object.fromEntries(
                        Object.entries(articleData).filter(([_, v]) => v !== null && v !== undefined)
                    );
                }
            }

            const response = await djangoApi.patch(`${API_CONFIG.DJANGO_ENDPOINTS.ARTICLE_CREATE}${articleId}/`, payload, { headers });
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

    // 6c. Top Stories CRUD (Admin)
    getTopStoriesList: async (params = {}) => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TOP_STORIES_CMS, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin top stories:', error);
            return { results: [], next_cursor: null, has_next: false };
        }
    },

    createTopStory: async (data) => {
        try {
            // Send as JSON - media is now handled via media_ids array
            const response = await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.TOP_STORIES_CMS, data);
            return response.data;
        } catch (error) {
            console.error('Error creating top story:', error);
            throw error;
        }
    },

    updateTopStory: async (id, data) => {
        try {
            // Send as JSON - media is now handled via media_ids array
            const response = await djangoApi.patch(`${API_CONFIG.DJANGO_ENDPOINTS.TOP_STORIES_CMS}${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating top story:', error);
            throw error;
        }
    },

    // Public Top Stories (no auth required)
    getTopStoriesPublic: async ({ category = null, limit = 5 } = {}) => {
        try {
            const params = { limit };
            if (category) params.category = category;
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TOP_STORIES_PUBLIC, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching public top stories:', error);
            return { results: [] };
        }
    },

    deleteTopStory: async (id) => {
        try {
            const response = await djangoApi.delete(`${API_CONFIG.DJANGO_ENDPOINTS.TOP_STORIES_CMS}${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting top story:', error);
            throw error;
        }
    },

    getRelatedArticles: async (section, slug) => {
        try {
            const response = await djangoApi.get(`cms/articles/${section}/${slug}/related/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching related articles:', error);
            return { results: [] };
        }
    },

    // 7. Taxonomy / Categories
    getTaxonomyBySection: async (section, lang = null) => {
        try {
            const params = lang ? { lang: lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang) } : {};
            const response = await djangoApi.get(`taxonomy/${section}/tree/`, { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy for ${section}:`, error);
            return [];
        }
    },

    getAdminCategories: async (params = {}) => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORIES_CMS, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin categories:', error);
            return { results: [], next_cursor: null, has_next: false };
        }
    },

    createCategory: async (categoryData) => {
        try {
            const response = await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORIES_CREATE, categoryData);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            const response = await djangoApi.patch(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORY_DETAIL(id), categoryData);
            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const response = await djangoApi.delete(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORY_DELETE(id));
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    disableCategory: async (id) => {
        try {
            const response = await djangoApi.patch(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORY_DISABLE(id));
            return response.data;
        } catch (error) {
            console.error('Error disabling category:', error);
            throw error;
        }
    },

    enableCategory: async (id) => {
        try {
            const response = await djangoApi.patch(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORY_ENABLE(id));
            return response.data;
        } catch (error) {
            console.error('Error enabling category:', error);
            throw error;
        }
    },

    getSections: async () => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_CMS);
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.data || data?.content || []);
        } catch (error) {
            console.error('Error fetching taxonomy sections:', error);
            return [];
        }
    },

    createSection: async (sectionData) => {
        try {
            const response = await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_CREATE, sectionData);
            return response.data;
        } catch (error) {
            console.error('Error creating taxonomy section:', error);
            throw error;
        }
    },

    updateSection: async (id, sectionData) => {
        try {
            const response = await djangoApi.patch(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTION_DETAIL(id), sectionData);
            return response.data;
        } catch (error) {
            console.error('Error updating taxonomy section:', error);
            throw error;
        }
    },

    deleteSection: async (id) => {
        try {
            const response = await djangoApi.delete(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTION_DELETE(id));
            return response.data;
        } catch (error) {
            console.error('Error deleting taxonomy section:', error);
            throw error;
        }
    },

    getCategoryChildren: async (section, parentId) => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CHILDREN(section), {
                params: { parent_id: parentId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching category children for ${section}/${parentId}:`, error);
            return [];
        }
    },

    getTaxonomyTree: async (section, lang = null) => {
        try {
            const params = lang ? { lang: lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang) } : {};
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_TREE(section), { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy tree for ${section}:`, error);
            return [];
        }
    },

    getTaxonomyLevels: async (section, lang = null) => {
        try {
            const params = lang ? { lang: lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang) } : {};
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_LEVELS(section), { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy levels for ${section}:`, error);
            return [];
        }
    },

    // 8. Public Feeds & Analytics
    getCategoryBlocks: async (section, lang = 'en', limit = 6) => {
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

    getSearchSuggestions: async (q, section, lang = 'en') => {
        try {
            const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);
            const response = await djangoApi.get('cms/articles/search-suggestions/', {
                params: { q, section, lang: langCode }
            });
            const data = response.data;
            // Handle different response formats: direct array, or object with 'suggestions', 'results', 'data', 'content'
            return Array.isArray(data) ? data : (data?.suggestions || data?.results || data?.data || data?.content || []);
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

    getSectionFeed: async (section, lang = 'en') => {
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

// Youtube Service (Spring Boot)
export const youtubeService = {
    // Categories
    CATEGORIES: {
        SHORT: 'SHORT',
        LONG: 'LONG'
    },

    // Get YouTube URLs by category/filters
    getYoutubeUrls: async (category, cursorId = null, filters = {}) => {
        try {
            const params = { category };
            if (cursorId) params.cursorId = cursorId;
            
            // Map frontend standard names to backend expected if different
            if (filters.category) params.category_slug = filters.category;
            if (filters.sub_category) params.sub_category_slug = filters.sub_category;
            if (filters.segment) params.segment = filters.segment;

            const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_YT_URLS_BY_CATEGORY, { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching YouTube URLs:`, error);
            return [];
        }
    },

    // Create YouTube URLs
    createYoutubeUrls: async (youtubeUrls) => {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CREATE_YT_URLS, youtubeUrls);
            return response.data;
        } catch (error) {
            console.error('Error creating YouTube URLs:', error);
            throw error;
        }
    },

    // Update YouTube URL
    updateYoutubeUrl: async (youtubeUrl) => {
        try {
            const response = await apiClient.put(API_CONFIG.ENDPOINTS.EDIT_YT_URLS, youtubeUrl);
            return response.data;
        } catch (error) {
            console.error('Error updating YouTube URL:', error);
            throw error;
        }
    },

    // Delete YouTube URLs
    deleteYoutubeUrls: async (ids) => {
        try {
            const response = await apiClient.delete(API_CONFIG.ENDPOINTS.DELETE_YT_URLS, { data: ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting YouTube URLs:', error);
            throw error;
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
    getSections: async (isAdmin = false, lang = null) => {
        try {
            const endpoint = isAdmin 
                ? API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_CMS 
                : API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_PUBLIC;
            const params = lang ? { lang: lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang) } : {};
            const response = await djangoApi.get(endpoint, { params });
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.data || data?.content || []);
        } catch (error) {
            console.error('Error fetching taxonomy sections:', error);
            return [];
        }
    },

    getTaxonomyLevels: async (section) => {
        try {
            const response = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_LEVELS(section));
            return response.data;
        } catch (error) {
            console.error(`Error fetching taxonomy levels for ${section}:`, error);
            return [];
        }
    }
};

// Global Search Service — Pure client-side deep search across ALL modules.
// No dedicated backend search endpoint. Fetches raw content from regular APIs
// and the public taxonomy tree, then filters entirely in the browser.
export const globalSearchService = {
    searchAll: async (query, types = ['all']) => {
        if (!query || query.trim().length < 2) {
            return { results: [], totalResults: 0, resultsByType: {} };
        }

        const searchQuery = query.trim();
        const searchTerm = searchQuery.toLowerCase();
        const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);

        // Deep match helper: every search word must appear somewhere in the serialised object
        const deepMatch = (obj) => {
            const str = JSON.stringify(obj).toLowerCase();
            return searchWords.every(w => str.includes(w));
        };

        const resultMap = {
            articles: [],       // News
            campusPages: [],    // Campus Pages
            jobs: [],
            papers: [],
            currentAffairs: [],
            academics: [],
            exams: [],
            taxonomy: [],       // Sections / Categories / Sub-cats / Segments / Topics
            estore: []
        };

        const promises = [];

        // ── Articles: fetch ALL published — split into News + Campus Pages ──────
        if (types.includes('all') || types.includes('article') || types.includes('campusPages')) {
            promises.push(
                djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.PUBLISHED_ARTICLES, { params: { limit: 500 } })
                    .then(res => {
                        const items = res.data?.results || (Array.isArray(res.data) ? res.data : []);

                        items.forEach(a => {
                            if (!deepMatch(a)) return;
                            const sec = (a.section || '').toLowerCase().replace(/_/g, '-');
                            const mapped = {
                                id: a.id,
                                title: a.headline || a.title || a.title_en || a.title_te || a.headline_en || a.headline_te || '',
                                summary: a.summary || a.description_en || a.description_te || '',
                                publishedAt: a.published_at,
                                image: a.banner_media?.url,
                                section: a.section,
                                category: a.category_name,
                                subCategory: a.sub_category_name,
                                segment: a.segment_name,
                                topic: a.topic_name
                            };

                            if (sec === 'campus-pages') {
                                resultMap.campusPages.push({
                                    ...mapped,
                                    type: 'campusPage',
                                    url: `/article/campus-pages/${a.slug}`
                                });
                            } else if (sec === 'current-affairs') {
                                // handled by currentAffairs bucket separately
                            } else {
                                resultMap.articles.push({
                                    ...mapped,
                                    type: 'article',
                                    url: `/article/${a.section}/${a.slug}`
                                });
                            }
                        });

                        // Trim to reasonable limits
                        resultMap.articles = resultMap.articles.slice(0, 20);
                        resultMap.campusPages = resultMap.campusPages.slice(0, 15);
                    })
                    .catch(() => {
                        resultMap.articles = [];
                        resultMap.campusPages = [];
                    })
            );
        }

        // ── Jobs ──────────────────────────────────────────────────────────────
        if (types.includes('all') || types.includes('jobs')) {
            promises.push(
                djangoApi.get('jobs/', { params: { limit: 200 } })
                    .then(res => {
                        const items = res.data?.results || (Array.isArray(res.data) ? res.data : []);
                        resultMap.jobs = items
                            .filter(deepMatch)
                            .slice(0, 15)
                            .map(j => ({
                                type: 'job',
                                id: j.id,
                                title: j.title || '',
                                company: j.company || '',
                                location: j.location || '',
                                jobType: j.job_type || j.type || '',
                                qualification: j.qualification || '',
                                url: `/jobs/${j.slug || j.id}`,
                                postedAt: j.posted_at || j.created_at
                            }));
                    })
                    .catch(() => { resultMap.jobs = []; })
            );
        }

        // ── Question Papers ────────────────────────────────────────────────────
        if (types.includes('all') || types.includes('papers')) {
            promises.push(
                questionPaperService.getPapersByCategory('QUESTIONPAPER', null, 100)
                    .then(papers => {
                        resultMap.papers = (papers || [])
                            .filter(deepMatch)
                            .slice(0, 15)
                            .map(p => ({
                                type: 'paper',
                                id: p.id,
                                title: p.title || '',
                                description: p.description || '',
                                url: p.presignedUrl,
                                category: p.category,
                                createdAt: p.creationDate
                            }));
                    })
                    .catch(() => { resultMap.papers = []; })
            );
        }

        // ── Current Affairs ────────────────────────────────────────────────────
        if (types.includes('all') || types.includes('currentAffairs')) {
            promises.push(
                currentAffairsService.getAllAffairs({ limit: 100 })
                    .then(affairs => {
                        resultMap.currentAffairs = (affairs || [])
                            .filter(deepMatch)
                            .slice(0, 15)
                            .map(ca => ({
                                type: 'currentAffair',
                                id: ca.id,
                                title: ca.title || '',
                                summary: ca.summary || '',
                                url: `/current-affairs/${ca.id}`,
                                language: ca.language,
                                createdAt: ca.createdAt
                            }));
                    })
                    .catch(() => { resultMap.currentAffairs = []; })
            );
        }

        // ── Academics (Materials + Hierarchy Levels & Subjects) ────────────────
        if (types.includes('all') || types.includes('academics')) {
            promises.push(
                academicsService.getMaterials({ limit: 100 })
                    .then(materials => {
                        const matched = (materials || []).filter(deepMatch);
                        resultMap.academics.push(...matched.slice(0, 15).map(m => ({
                            type: 'academic',
                            id: m.id,
                            title: m.title || m.name || m.headline || '',
                            summary: m.summary || m.description || '',
                            url: `/academics/material/${m.slug}`,
                            section: 'academics'
                        })));
                    })
                    .catch(() => {})
            );

            promises.push(
                academicsService.getAcademicsHierarchy()
                    .then(hierarchy => {
                        const matched = [];
                        (hierarchy || []).forEach(level => {
                            if (deepMatch(level)) {
                                matched.push({
                                    type: 'academic',
                                    id: `level-${level.id}`,
                                    title: level.name || '',
                                    summary: `Academic Level: ${level.name}`,
                                    url: `/curriculum?level=${level.id}`
                                });
                            }
                            (level.subjects || []).forEach(subject => {
                                if (deepMatch(subject)) {
                                    matched.push({
                                        type: 'academic',
                                        id: `subject-${subject.id}`,
                                        title: subject.name || '',
                                        summary: `Subject: ${subject.name} › ${level.name}`,
                                        url: `/academics/subject/${subject.slug}`
                                    });
                                }
                            });
                        });
                        resultMap.academics.push(...matched);
                    })
                    .catch(() => {})
            );
        }

        // ── Exams (Chapters from hierarchy — each chapter = a startable exam) ──
        if (types.includes('all') || types.includes('exams')) {
            promises.push(
                academicsService.getAcademicsHierarchy()
                    .then(hierarchy => {
                        const matched = [];
                        (hierarchy || []).forEach(level => {
                            (level.subjects || []).forEach(subject => {
                                (subject.chapters || []).forEach(chapter => {
                                    const chapterObj = {
                                        ...chapter,
                                        level_name: level.name,
                                        subject_name: subject.name
                                    };
                                    if (deepMatch(chapterObj)) {
                                        matched.push({
                                            type: 'exam',
                                            id: `chapter-${chapter.id}`,
                                            title: chapter.name || chapter.title || '',
                                            summary: `${subject.name} › ${level.name}`,
                                            url: `/curriculum`,
                                            examConfig: {
                                                type: 'chapter',
                                                value: String(chapter.id),
                                                label: chapter.name || chapter.title
                                            }
                                        });
                                    }
                                });
                            });
                        });
                        resultMap.exams = matched.slice(0, 15);
                    })
                    .catch(() => { resultMap.exams = []; })
            );
        }

        // ── Taxonomy Tree: Sections → Categories → Sub-cats → Segments → Topics ─
        if (types.includes('all') || types.includes('taxonomy')) {
            promises.push(
                djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_PUBLIC)
                    .then(async sectionsRes => {
                        const sections = sectionsRes.data?.results || (Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
                        const taxResults = [];

                        // Match sections themselves
                        sections.forEach(section => {
                            if (deepMatch(section)) {
                                taxResults.push({
                                    type: 'taxonomy',
                                    id: `section-${section.id || section.slug}`,
                                    title: section.name || section.title || '',
                                    summary: `Section: ${section.name || section.title}`,
                                    url: `/${section.slug || section.id}`
                                });
                            }
                        });

                        // Fetch full tree for each section and walk ALL nodes
                        await Promise.allSettled(
                            sections.map(section =>
                                djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_TREE(section.slug || section.id))
                                    .then(treeRes => {
                                        const tree = treeRes.data?.results || (Array.isArray(treeRes.data) ? treeRes.data : (treeRes.data ? [treeRes.data] : []));

                                        const walkNode = (node, breadcrumb) => {
                                            if (!node) return;
                                            const label = node.name || node.title || '';
                                            const crumb = breadcrumb ? `${breadcrumb} › ${label}` : label;
                                            const nodeSlug = node.slug || node.id;
                                            const sectionSlug = section.slug || section.id;

                                            if (deepMatch(node)) {
                                                taxResults.push({
                                                    type: 'taxonomy',
                                                    id: `tax-${sectionSlug}-${nodeSlug}`,
                                                    title: label,
                                                    summary: crumb,
                                                    url: `/${sectionSlug}/${nodeSlug}`
                                                });
                                            }

                                            // Recurse into children at any depth
                                            const children = node.children || node.categories || node.sub_categories || node.subcategories || node.segments || node.topics || [];
                                            children.forEach(child => walkNode(child, crumb));
                                        };

                                        (Array.isArray(tree) ? tree : [tree]).forEach(node => walkNode(node, section.name || section.title));
                                    })
                                    .catch(() => {})
                            )
                        );

                        resultMap.taxonomy = taxResults.slice(0, 20);
                    })
                    .catch(() => { resultMap.taxonomy = []; })
            );
        }

        // ── E-Store (local encrypted cache) ───────────────────────────────────
        if (types.includes('all') || types.includes('estore')) {
            promises.push(
                (async () => {
                    try {
                        const { default: products } = await import('../modules/_cv_sys_cache/data/loader');
                        resultMap.estore = (products || [])
                            .filter(deepMatch)
                            .slice(0, 5)
                            .map(p => ({
                                type: 'product',
                                id: p.id,
                                title: p.name || '',
                                summary: p.description || '',
                                price: p.price,
                                image: p.image,
                                url: `/e-store/product/${p.id}`
                            }));
                    } catch (_) {}
                })()
            );
        }

        await Promise.allSettled(promises);

        const allResults = [
            ...resultMap.articles,
            ...resultMap.campusPages,
            ...resultMap.jobs,
            ...resultMap.papers,
            ...resultMap.currentAffairs,
            ...resultMap.academics,
            ...resultMap.exams,
            ...resultMap.taxonomy,
            ...resultMap.estore
        ];

        return {
            query: searchQuery,
            results: allResults,
            totalResults: allResults.length,
            resultsByType: {
                articles: resultMap.articles.length,
                campusPages: resultMap.campusPages.length,
                jobs: resultMap.jobs.length,
                papers: resultMap.papers.length,
                currentAffairs: resultMap.currentAffairs.length,
                academics: resultMap.academics.length,
                exams: resultMap.exams.length,
                taxonomy: resultMap.taxonomy.length,
                estore: resultMap.estore.length
            }
        };
    }
};

