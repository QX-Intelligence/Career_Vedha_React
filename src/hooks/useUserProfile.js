import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api, { getUserContext, setUserContext, getAccessToken } from '../services/api';
import API_CONFIG from '../config/api.config';

/**
 * Hook to manage user profile data with TanStack Query.
 * Provides caching to prevent flickering and ensures auth context is synced.
 */
export const useUserProfile = () => {
    const context = getUserContext();
    const { isAuthenticated, email } = context;

    const query = useQuery({
        queryKey: ['userProfile', 'current'], // Stable key to prevent double fetch on sync
        queryFn: async () => {
            const res = await api.get(API_CONFIG.ENDPOINTS.GET_PROFILE);
            return res.data;
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    // Synchronize auth context when data is fetched or updated
    useEffect(() => {
        if (query.data) {
            const { firstName, lastName, status, email: profileEmail, id, userId } = query.data;
            const currentId = id || userId;
            const token = getAccessToken();
            // Update context if any core field is missing or different
            if (
                context.email !== profileEmail ||
                context.id !== currentId ||
                context.firstName !== firstName ||
                context.lastName !== lastName ||
                context.status !== status
            ) {
                setUserContext(token, context.role, profileEmail, firstName, lastName, status, currentId);
            }
        }
    }, [query.data, context.role, context.email, context.id, context.firstName, context.lastName, context.status]);

    return query;
};
