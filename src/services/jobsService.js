import djangoApi from './djangoApi';
import API_CONFIG from '../config/api.config';

export const jobsService = {
    // ----------------------------------------------------
    // CMS Management (Protected)
    // ----------------------------------------------------

    // Get jobs for management
    // NOTE: Backend doesn't have cms/jobs/list/ endpoint yet
    // Using public endpoint - status will need to be inferred from other fields
    getAdminJobs: async (params = {}) => {
        try {
            const response = await djangoApi.get('jobs/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin jobs:', error);
            return { results: [], has_next: false };
        }
    },

    // Create a new job
    createJob: async (jobData) => {
        try {
            const response = await djangoApi.post('cms/jobs/', jobData);
            return response.data;
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    },

    // Update an existing job
    updateJob: async (jobId, jobData) => {
        try {
            const response = await djangoApi.patch(`cms/jobs/${jobId}/`, jobData);
            return response.data;
        } catch (error) {
            console.error('Error updating job:', error);
            throw error;
        }
    },

    // Activate a job
    activateJob: async (jobId) => {
        try {
            const response = await djangoApi.patch(`cms/jobs/${jobId}/activate/`);
            return response.data;
        } catch (error) {
            console.error('Error activating job:', error);
            throw error;
        }
    },

    // Deactivate a job
    deactivateJob: async (jobId) => {
        try {
            const response = await djangoApi.patch(`cms/jobs/${jobId}/deactivate/`);
            return response.data;
        } catch (error) {
            console.error('Error deactivating job:', error);
            throw error;
        }
    },

    // ----------------------------------------------------
    // Public API
    // ----------------------------------------------------

    // Get public job list with filters and cursor pagination
    getPublicJobs: async (params = {}) => {
        try {
            const response = await djangoApi.get('jobs/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching public jobs:', error);
            return { results: [], has_next: false };
        }
    },

    // Get filter options (types, locations, orgs)
    getJobFilters: async () => {
        try {
            const response = await djangoApi.get('jobs/filters/');
            return response.data;
        } catch (error) {
            console.error('Error fetching job filters:', error);
            return { job_type_counts: [], top_locations: [], top_organizations: [] };
        }
    },

    // Get trending jobs
    getTrendingJobs: async () => {
        try {
            const response = await djangoApi.get('jobs/trending/');
            return response.data;
        } catch (error) {
            console.error('Error fetching trending jobs:', error);
            return { results: [] };
        }
    },

    // Get search suggestions
    getSearchSuggestions: async (q) => {
        try {
            const response = await djangoApi.get('jobs/search-suggestions/', {
                params: { q }
            });
            return response.data.suggestions || [];
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            return [];
        }
    },

    // Get single job detail by slug
    getJobDetail: async (slug) => {
        try {
            const response = await djangoApi.get(`jobs/${slug}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching job detail:', error);
            throw error;
        }
    },

    // Get SEO metadata for a job
    getJobSEO: async (slug) => {
        try {
            const response = await djangoApi.get(`jobs/${slug}/seo/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching job SEO:', error);
            return null;
        }
    }
};
