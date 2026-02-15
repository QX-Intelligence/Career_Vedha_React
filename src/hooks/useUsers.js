import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import API_CONFIG from '../config/api.config';

// Query keys for caching
export const userKeys = {
    all: ['users'],
    lists: () => [...userKeys.all, 'list'],
    list: (filter) => [...userKeys.lists(), filter],
    roles: ['roles']
};

/**
 * Hook to fetch users based on filter (active, inactive, all, search)
 */
export const useUsers = ({ tab, page, size, keyword }) => {
    return useQuery({
        queryKey: userKeys.list({ tab, page, size, keyword }),
        queryFn: async () => {
            let url = '';
            const params = { page, size };

            switch (tab) {
                case 'active':
                    url = '/get-active-users';
                    break;
                case 'inactive':
                    url = '/get-inactive-users';
                    break;
                case 'all':
                    url = '/get-all-users';
                    break;
                case 'search':
                    if (!keyword?.trim()) {
                        return { content: [], totalPages: 0, totalElements: 0 };
                    }
                    url = '/search';
                    params.keyword = keyword;
                    break;
                default:
                    url = '/get-active-users';
            }

            const { data } = await api.get(url, { params });
            return data;
        },
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to fetch available roles
 */
export const useRoles = (enabled = true) => {
    return useQuery({
        queryKey: userKeys.roles,
        queryFn: async () => {
            const { data } = await api.get('/role-names');
            return data || [];
        },
        enabled,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

/**
 * Hook to change a user's role
 */
export const useChangeRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, roleName }) => {
            await api.put('/change-role', null, {
                params: { email, roleName }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
};

/**
 * Hook to toggle user status (activate/inactivate)
 */
export const useToggleUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, currentStatus }) => {
            const endpoint = currentStatus ? '/inactivate-user' : '/activate-user';
            await api.put(endpoint, null, {
                params: { email },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
};
