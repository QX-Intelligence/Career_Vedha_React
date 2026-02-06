import djangoApi from './djangoApi';
import API_CONFIG from '../config/api.config';

/**
 * Media Service
 * Handles all media-related operations using the merged Django CMS service.
 */
const mediaService = {
    /**
     * Upload media file (multipart/form-data)
     */
    upload: async (formData) => {
        const response = await djangoApi.post(API_CONFIG.MEDIA.UPLOAD, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * List media assets (paginated)
     */
    list: async (params = {}) => {
        const response = await djangoApi.get(API_CONFIG.MEDIA.LIST, { params });
        return response.data;
    },

    /**
     * Get a presigned download/view URL for a private asset
     */
    getPresigned: async (id) => {
        const response = await djangoApi.get(`${API_CONFIG.MEDIA.PRESIGNED}${id}/presigned/`);
        return response.data;
    },

    /**
     * Resolve media metadata and URL in one call
     */
    resolve: async (id) => {
        const response = await djangoApi.get(`${API_CONFIG.MEDIA.RESOLVE}${id}/resolve/`);
        return response.data;
    },

    /**
     * Update/Replace media asset
     */
    replace: async (id, formData) => {
        const response = await djangoApi.patch(`${API_CONFIG.MEDIA.REPLACE}${id}/replace/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Delete media asset (soft-delete by default)
     */
    delete: async (id) => {
        const response = await djangoApi.delete(`${API_CONFIG.MEDIA.DELETE}${id}/`);
        return response.data;
    }
};

export default mediaService;

