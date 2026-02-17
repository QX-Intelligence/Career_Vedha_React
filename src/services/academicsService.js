import djangoApi from './djangoApi';
import api from './api';
import API_CONFIG from '../config/api.config';

/**
 * Academics Service
 * Handles all academics-related API calls for levels, subjects, chapters, and materials
 */
export const academicsService = {
    // ==================== PUBLIC APIs ====================
    
    /**
     * Get all academic levels (10th, Intermediate, B.Tech, etc.)
     * @param {Object} params - Query parameters (board filter)
     */
    getLevels: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/levels/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching academic levels:', error);
            throw error;
        }
    },

    /**
     * Get subjects for a specific level
     * @param {Object} params - Query parameters (level, level__slug)
     */
    getSubjects: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/subjects/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            throw error;
        }
    },

    /**
     * Get all academic categories (Study Material, Previous Papers, etc.)
     */
    getCategories: async () => {
        try {
            const response = await djangoApi.get('academics/categories/');
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    /**
     * Get chapters for a subject
     * @param {Object} params - Query parameters (subject, is_active, search)
     */
    getChapters: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/chapters/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching chapters:', error);
            throw error;
        }
    },

    /**
     * Get detailed chapter information with materials (Unified)
     * @param {number|string} id - Chapter ID or Slug
     */
    getChapterDetail: async (id) => {
        try {
            const response = await djangoApi.get(`academics/chapters/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching chapter detail for ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get materials with filters
     * @param {Object} params - Query parameters (level, subject, category, chapter, etc.)
     */
    getMaterials: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/materials/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching materials:', error);
            throw error;
        }
    },

    /**
     * Get materials by chapter ID
     * @param {number} chapterId - Chapter ID
     * @returns {Promise} Material data with translations and media
     */
    getMaterialsByChapter: async (chapterId, subjectId, lang = 'te') => {
        try {
            // WORKAROUND 2: The materials list endpoint is broken (level filter).
            // Using subject-blocks which provides all chapters + materials for a subject.
            const response = await djangoApi.get('academics/subject-blocks/', {
                params: { subject_id: subjectId, lang }
            });
            
            // Find the specific chapter block
            const subjectData = response.data;
            const chapterBlock = subjectData.find(block => block.chapter.id === parseInt(chapterId));
            
            return chapterBlock || { chapter: { id: chapterId }, materials: [] };
        } catch (error) {
            console.error(`Error fetching materials for chapter ${chapterId}:`, error);
            throw error;
        }
    },

    /**
     * Get material detail by slug
     * @param {string} slug - Material slug
     */
    getMaterialDetail: async (slug) => {
        try {
            const response = await djangoApi.get(`academics/materials/${slug}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching material detail for ${slug}:`, error);
            throw error;
        }
    },

    /**
     * Get level blocks (subjects grouped by level)
     * @param {string} board - Board filter (AP, TS, CBSE, NONE)
     */
    getLevelBlocks: async (board = 'AP') => {
        try {
            const response = await djangoApi.get('academics/level-blocks/', {
                params: { board }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching level blocks:', error);
            throw error;
        }
    },

    /**
     * Get subject blocks (materials grouped by chapter)
     * @param {string} subjectSlug - Subject slug
     * @param {string} lang - Language (te/en)
     */
    getSubjectBlocks: async (subjectId, lang = 'te') => {
        try {
            const response = await djangoApi.get('academics/subject-blocks/', {
                params: { subject_id: subjectId, lang }
            });
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.content || []);
        } catch (error) {
            console.error('Error fetching subject blocks:', error);
            throw error;
        }
    },

    // ==================== CMS APIs (EDITOR+ Role) ====================

    // Level Management
    createLevel: async (data) => {
        try {
            const response = await djangoApi.post('academics/cms/levels/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating level:', error);
            throw error;
        }
    },

    updateLevel: async (id, data) => {
        try {
            const response = await djangoApi.patch(`academics/cms/levels/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating level:', error);
            throw error;
        }
    },

    deleteLevel: async (id) => {
        try {
            const response = await djangoApi.delete(`academics/cms/levels/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting level:', error);
            throw error;
        }
    },

    getAdminLevels: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/cms/levels/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin levels:', error);
            throw error;
        }
    },

    // Subject Management
    createSubject: async (data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.post('academics/cms/subjects/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    },

    updateSubject: async (id, data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.patch(`academics/cms/subjects/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating subject:', error);
            throw error;
        }
    },

    deleteSubject: async (id) => {
        try {
            const response = await djangoApi.delete(`academics/cms/subjects/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    },

    getAdminSubjects: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/cms/subjects/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin subjects:', error);
            throw error;
        }
    },

    // Category Management
    createCategory: async (data) => {
        try {
            const response = await djangoApi.post('academics/cms/categories/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    updateCategory: async (id, data) => {
        try {
            const response = await djangoApi.patch(`academics/cms/categories/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const response = await djangoApi.delete(`academics/cms/categories/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    getAdminCategories: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/cms/categories/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin categories:', error);
            throw error;
        }
    },

    // Chapter Management
    createChapter: async (data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'attachments' && Array.isArray(data[key])) {
                    data[key].forEach(file => formData.append('attachments', file));
                } else if (key === 'media_ids' && Array.isArray(data[key])) {
                    data[key].forEach(id => formData.append('media_ids', id));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.post('academics/cms/chapters/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating chapter:', error);
            throw error;
        }
    },

    updateChapter: async (id, data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'attachments' && Array.isArray(data[key])) {
                    data[key].forEach(file => formData.append('attachments', file));
                } else if (key === 'media_ids' && Array.isArray(data[key])) {
                    data[key].forEach(id => formData.append('media_ids', id));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.patch(`academics/cms/chapters/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating chapter:', error);
            throw error;
        }
    },

    deleteChapter: async (id) => {
        try {
            const response = await djangoApi.delete(`academics/cms/chapters/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting chapter:', error);
            throw error;
        }
    },

    getAdminChapters: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/cms/chapters/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin chapters:', error);
            throw error;
        }
    },

    // Material Management
    createMaterial: async (data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'attachments' && Array.isArray(data[key])) {
                    data[key].forEach(file => formData.append('attachments', file));
                } else if (key === 'media_ids' && Array.isArray(data[key])) {
                    data[key].forEach(id => formData.append('media_ids', id));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.post('academics/cms/materials/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating material:', error);
            throw error;
        }
    },

    updateMaterial: async (id, data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'attachments' && Array.isArray(data[key])) {
                    data[key].forEach(file => formData.append('attachments', file));
                } else if (key === 'media_ids' && Array.isArray(data[key])) {
                    data[key].forEach(id => formData.append('media_ids', id));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            const response = await djangoApi.patch(`academics/cms/materials/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating material:', error);
            throw error;
        }
    },

    deleteMaterial: async (id, hard = false) => {
        try {
            const response = await djangoApi.delete(`academics/cms/materials/${id}/`, {
                params: { hard: hard ? 'true' : 'false' }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting material:', error);
            throw error;
        }
    },

    getAdminMaterials: async (params = {}) => {
        try {
            const response = await djangoApi.get('academics/cms/materials/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin materials:', error);
            throw error;
        }
    },

    /**
     * Get the full academics hierarchy (Levels -> Subjects -> Chapters)
     * Note: This hits the Java backend (8080)
     */
    getAcademicsHierarchy: async () => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.ACADEMICS_HIERARCHY);
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.content || []);
        } catch (error) {
            console.error('Error fetching academics hierarchy:', error);
            throw error;
        }
    },

    /**
     * Get the academics hierarchy from Django CMS
     * Useful for CMS management and unified rendering
     */
    getDjangoHierarchy: async () => {
        try {
            const response = await djangoApi.get('academics/hierarchy/');
            const data = response.data;
            return Array.isArray(data) ? data : (data?.results || data?.content || []);
        } catch (error) {
            console.error('Error fetching Django academics hierarchy:', error);
            throw error;
        }
    }
};
