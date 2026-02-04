import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
    fetchUnseenRoleNotifications, 
    markRoleNotificationsSeen, 
    fetchArticleNotifications, 
    fetchArticleUnseenCount, 
    markArticleSeen,
    approveRequest,
    rejectRequest
} from '../services/notificationService';
import { getUserContext } from '../services/api';
import API_CONFIG from '../config/api.config';
import { useSnackbar } from '../context/SnackbarContext';
import { useEffect, useMemo, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * Hook to manage system notifications across the application.
 * Supports legacy Article notifications and new Role Approval notifications.
 */
export const useNotifications = () => {
    const { role, id: userId } = getUserContext();
    const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();
    
    // --- 1. Article Notifications (Post Notifications) ---
    
    // Unseen Count for Badge
    const articleUnseenCountQuery = useQuery({
        queryKey: ['notifications', 'articles', 'unseen-count'],
        queryFn: fetchArticleUnseenCount,
        enabled: !!userId,
        refetchInterval: 60000,
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
        enabled: !!userId,
    });

    const markArticleSeenMutation = useMutation({
        mutationFn: markArticleSeen,
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
        refetchInterval: 30000,
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

    useEffect(() => {
        if (!userId || !role) return;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(API_CONFIG.WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                // Subscribe to Post Notifications
                stompClient.subscribe(`/topic/notifications/${role}`, (msg) => {
                    const notification = JSON.parse(msg.body);
                    // Add to infinite query data or just refetch
                    queryClient.invalidateQueries({ queryKey: ['notifications', 'articles'] });
                    articleUnseenCountQuery.refetch();
                });

                // Subscribe to Role Approvals
                if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                    const topics = role === 'SUPER_ADMIN' ? ['ADMIN', 'SUPER_ADMIN'] : ['ADMIN'];
                    topics.forEach(t => {
                        stompClient.subscribe(`/topic/approvals/${t}`, (msg) => {
                            queryClient.invalidateQueries({ queryKey: ['notifications', 'roles'] });
                        });
                    });
                }
            },
        });

        stompClient.activate();
        return () => stompClient.deactivate();
    }, [userId, role, queryClient]);

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
