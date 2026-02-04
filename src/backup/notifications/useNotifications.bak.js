import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, fetchNotificationsByStatus, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../services/notificationService';
import { getUserContext } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook to manage system notifications across the application.
 * Centralizes state, fetching, and actions (approve/reject).
 */
export const useNotifications = () => {
    const { role } = getUserContext();
    const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();
    
    // Status filters for different views (Summary, Pending List, Archive)
    const [pendingFilterDate, setPendingFilterDate] = useState('');
    const [archiveFilterDate, setArchiveFilterDate] = useState('');

    // Fetch unseen count (for the bell badge)
    const unseenQuery = useQuery({
        queryKey: ['notifications', 'unseen', role],
        queryFn: () => fetchNotifications(role, { size: 50 }),
        enabled: !!role,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch pending notifications
    const pendingQuery = useQuery({
        queryKey: ['notifications', 'pending', role],
        queryFn: () => fetchNotificationsByStatus('PENDING', role, { size: 50 }),
        enabled: !!role,
    });

    // Mark single as seen
    const markSeenMutation = useMutation({
        mutationFn: markAsSeen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as seen
    const markAllSeenMutation = useMutation({
        mutationFn: async () => {
            // 1. Call the backend's bulk endpoint (only clears current role)
            await markAllAsSeen(role);

            // 2. Identify items that the bulk endpoint missed (items from other roles)
            // Super Admins see notifications from 'CREATOR', 'PUBLISHER', etc.
            const unseen = queryClient.getQueryData(['notifications', 'unseen', role]);
            const items = Array.isArray(unseen) ? unseen : (unseen?.content || []);
            
            const otherRoleItems = items.filter(item => 
                item.role && item.role !== role && !item.seen
            );

            // 3. Individually mark them as seen to ensure UI is clean
            if (otherRoleItems.length > 0) {
                await Promise.all(otherRoleItems.map(item => markAsSeen(item.id)));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSnackbar("All notifications marked as seen", "success");
        },
    });

    // Approve request
    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSnackbar("Request approved successfully", "success");
        },
        onError: (error) => {
            showSnackbar(error?.response?.data?.message || "Failed to approve request", "error");
        }
    });

    // Reject request
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => rejectRequest(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showSnackbar("Request rejected", "info");
        },
        onError: (error) => {
            showSnackbar(error?.response?.data?.message || "Failed to reject request", "error");
        }
    });

    const unseenItems = useMemo(() => {
        const data = unseenQuery.data;
        return Array.isArray(data) ? data : (data?.content || []);
    }, [unseenQuery.data]);

    const pendingItems = useMemo(() => {
        const data = pendingQuery.data;
        return Array.isArray(data) ? data : (data?.content || []);
    }, [pendingQuery.data]);

    return {
        unseenCount: unseenItems.length,
        unseenItems,
        pendingItems,
        isLoading: unseenQuery.isLoading || pendingQuery.isLoading,
        markSeen: markSeenMutation.mutate,
        markAllSeen: markAllSeenMutation.mutate,
        approve: approveMutation.mutate,
        reject: rejectMutation.mutate,
        isActioning: approveMutation.isPending || rejectMutation.isPending,
        refetch: () => {
            unseenQuery.refetch();
            pendingQuery.refetch();
        }
    };
};
