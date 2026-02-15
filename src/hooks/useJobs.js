import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '../services/jobsService';

// Query keys for caching
export const jobKeys = {
    all: ['jobs'],
    adminList: (params) => [...jobKeys.all, 'admin-list', params],
    detail: (id) => [...jobKeys.all, 'detail', id],
    publicList: (params) => [...jobKeys.all, 'public-list', params],
};

/**
 * Hook to fetch admin jobs list
 */
export const useAdminJobs = (params = { limit: 100 }) => {
    return useQuery({
        queryKey: jobKeys.adminList(params),
        queryFn: async () => {
            const data = await jobsService.getAdminJobs(params);
            return data.results || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to activate a job
 */
export const useActivateJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId) => jobsService.activateJob(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all });
        },
    });
};

/**
 * Hook to deactivate a job
 */
export const useDeactivateJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId) => jobsService.deactivateJob(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all });
        },
    });
};

/**
 * Hook to delete a job (if needed, though currently not in UI)
 */
export const useDeleteJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId) => jobsService.deleteJob(jobId), // Assuming service has this or will have
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all });
        },
    });
};
