import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketService from '../services/socket';
import { getUserContext } from '../services/api';

/**
 * Hook to subscribe to real-time topics via WebSockets.
 * 
 * @param {string|string[]} topics - Topic(s) to subscribe to.
 * @param {Function} onMessage - Callback when a message is received.
 * @param {Object} options - Options for the subscription.
 * @param {string|string[]} options.invalidate - Query keys to invalidate on message.
 * @param {boolean} options.enabled - Whether the subscription is enabled (default: true).
 */
export const useRealTime = (topics, onMessage, options = {}) => {
    const { enabled = true, invalidate = [] } = options;
    const { role, isAuthenticated } = getUserContext();
    const queryClient = useQueryClient();

    const handleMessage = useCallback((data) => {
        if (onMessage) onMessage(data);

        // Auto-invalidate queries if requested
        if (invalidate.length > 0) {
            const keys = Array.isArray(invalidate[0]) ? invalidate : [invalidate];
            keys.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
        }
    }, [onMessage, invalidate, queryClient]);

    useEffect(() => {
        if (!enabled || !isAuthenticated || !role) return;

        socketService.connect(role);

        const topicList = Array.isArray(topics) ? topics : [topics];
        const unsubscribes = topicList.map(topic => 
            socketService.subscribe(topic, handleMessage)
        );

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [enabled, isAuthenticated, role, topics, handleMessage]);

    return {
        isConnected: socketService.isConnected,
        // Helper to manually subscribe to more topics if needed
        subscribe: (topic, cb) => socketService.subscribe(topic, cb)
    };
};
