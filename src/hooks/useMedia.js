import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import mediaService from '../services/mediaService';

export const mediaKeys = {
    all: ['media'],
    list: (params) => [...mediaKeys.all, 'list', params],
};

/**
 * Hook to fetch media list with pagination
 */
export const useMediaList = (params) => {
    return useQuery({
        queryKey: mediaKeys.list(params),
        queryFn: () => mediaService.list(params),
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
};

/**
 * Hook to upload media
 */
export const useUploadMedia = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mediaService.upload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        },
    });
};

/**
 * Hook to delete media
 */
export const useDeleteMedia = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mediaService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        },
    });
};

/**
 * Hook to replace/update media
 */
export const useReplaceMedia = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, formData }) => mediaService.replace(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mediaKeys.all });
        },
    });
};

/**
 * Hook to get presigned URL (Action)
 * Using useMutation since it's an action triggered by user, not a subscription
 */
export const useMediaPresigned = () => {
    return useMutation({
        mutationFn: mediaService.getPresigned,
    });
};
