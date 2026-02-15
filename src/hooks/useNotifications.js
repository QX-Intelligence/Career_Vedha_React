import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
    fetchUnseenRoleNotifications, 
    markRoleNotificationsSeen, 
    fetchArticleNotifications, 
    fetchArticleUnseenCount, 
    markArticleSeen,
    resetArticleUnseenCount,
    approveRequest,
    rejectRequest
} from '../services/notificationService';
import { getUserContext } from '../services/api';
import API_CONFIG from '../config/api.config';
import { useSnackbar } from '../context/SnackbarContext';
import { useEffect, useMemo, useRef } from 'react';
import SockJS from 'sockjs-client';
import { useRealTime } from './useRealTime';

/**
 * Hook to manage system notifications across the application.
 * Supports legacy Article notifications and new Role Approval notifications.
 */
export const useNotifications = () => {
    const { role, id: userId, isAuthenticated } = getUserContext();
    const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();
    
    // --- 1. Article Notifications (Post Notifications) ---
    
    // Unseen Count for Badge
    const articleUnseenCountQuery = useQuery({
        queryKey: ['notifications', 'articles', 'unseen-count'],
        queryFn: fetchArticleUnseenCount,
        enabled: isAuthenticated && role !== 'CONTRIBUTOR',
        refetchInterval: 120000, // 2 minutes
    });

    // Infinite Feed
    const articleNotificationsQuery = useInfiniteQuery({
        queryKey: ['notifications', 'articles', 'feed'],
        queryFn: ({ pageParam = {} }) => fetchArticleNotifications(pageParam),
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.length < 20) return undefined;
            const last = lastPage[lastPage.length - 1];
            return {
                createdAt: last.createdAt,
                cursorId: last.notificationId
            };
        },
        initialPageParam: {},
        enabled: isAuthenticated && role !== 'CONTRIBUTOR',
    });

    const markArticleSeenMutation = useMutation({
        mutationFn: markArticleSeen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'articles'] });
            articleUnseenCountQuery.refetch();
        },
    });

    const resetArticleSeenMutation = useMutation({
        mutationFn: resetArticleUnseenCount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'articles'] });
            articleUnseenCountQuery.refetch();
        },
    });

    // --- 2. Role Approval Notifications ---

    const roleNotificationsQuery = useQuery({
        queryKey: ['notifications', 'roles', 'unseen'],
        queryFn: () => fetchUnseenRoleNotifications(),
        enabled: !!role && (role === 'ADMIN' || role === 'SUPER_ADMIN'),
        refetchInterval: 60000, // 1 minute
    });

    const markRoleSeenMutation = useMutation({
        mutationFn: markRoleNotificationsSeen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'roles'] });
            showSnackbar("Notifications marked as seen", "success");
        },
    });

    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSnackbar("Request approved", "success");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => rejectRequest(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSnackbar("Request rejected", "info");
        },
    });

    // --- 3. WebSocket Real-time Sync ---

    useRealTime(
        [`/topic/notifications/${role}`],
        null, // No specific callback needed if using invalidate
        {
            enabled: isAuthenticated && !!role && role !== 'CONTRIBUTOR',
            invalidate: [['notifications', 'articles'], ['notifications', 'articles', 'unseen-count']]
        }
    );

    useRealTime(
        role === 'SUPER_ADMIN' ? [`/topic/approvals/ADMIN`, `/topic/approvals/SUPER_ADMIN`] : 
        role === 'ADMIN' ? [`/topic/approvals/ADMIN`] : [],
        null,
        {
            enabled: isAuthenticated && (role === 'ADMIN' || role === 'SUPER_ADMIN'),
            invalidate: [['notifications', 'roles']]
        }
    );

    // --- Derived Data ---

    const articleItems = useMemo(() => 
        articleNotificationsQuery.data?.pages.flat() || [], 
    [articleNotificationsQuery.data]);

    const roleItems = useMemo(() => 
        Array.isArray(roleNotificationsQuery.data) ? roleNotificationsQuery.data : [], 
    [roleNotificationsQuery.data]);

    return {
        // Article logic
        articleUnseenCount: articleUnseenCountQuery.data || 0,
        articleItems,
        isArticlesLoading: articleNotificationsQuery.isLoading,
        hasNextArticlesPage: articleNotificationsQuery.hasNextPage,
        fetchNextArticles: articleNotificationsQuery.fetchNextPage,
        markArticleSeen: markArticleSeenMutation.mutate,
        resetArticleUnseen: resetArticleSeenMutation.mutate,

        // Role logic
        roleUnseenCount: roleItems.length,
        roleItems,
        isRolesLoading: roleNotificationsQuery.isLoading,
        markRoleSeen: (ids) => markRoleSeenMutation.mutate(Array.isArray(ids) ? ids : [ids]),

        // Actions
        approve: approveMutation.mutate,
        reject: rejectMutation.mutate,
        isActioning: approveMutation.isPending || rejectMutation.isPending,

        // Overall state
        totalUnseenCount: (articleUnseenCountQuery.data || 0) + roleItems.length,
        isLoading: articleNotificationsQuery.isLoading || roleNotificationsQuery.isLoading,
        refetchAll: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    };
};
