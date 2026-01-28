import { useState, useEffect, useCallback, useRef } from 'react';
import cacheService, { CACHE_TTL } from '../services/cacheService';

/**
 * Custom hook for cache-aware data fetching
 * 
 * @param {string} cacheKey - Unique identifier for this query
 * @param {Function} fetcher - Async function that fetches the data
 * @param {Object} options - Configuration options
 * @param {number} options.ttl - Time to live in milliseconds
 * @param {boolean} options.enabled - Whether the query should run
 * @param {boolean} options.staleWhileRevalidate - Return stale data while fetching fresh
 * @param {Array} options.dependencies - Cache dependencies for invalidation
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * 
 * @returns {Object} { data, loading, error, refetch, isCached }
 */
const useCachedQuery = (cacheKey, fetcher, options = {}) => {
    const {
        ttl = CACHE_TTL.DEFAULT,
        enabled = true,
        staleWhileRevalidate = true,
        dependencies = [],
        onSuccess,
        onError
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCached, setIsCached] = useState(false);
    
    const fetcherRef = useRef(fetcher);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        fetcherRef.current = fetcher;
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    }, [fetcher, onSuccess, onError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const fetchData = useCallback(async (skipCache = false) => {
        if (!enabled) return;

        // Check cache first (unless explicitly skipping)
        if (!skipCache) {
            const cachedData = cacheService.get(cacheKey);
            if (cachedData !== null) {
                setData(cachedData);
                setIsCached(true);
                setError(null);
                
                // If stale-while-revalidate, continue to fetch in background
                if (!staleWhileRevalidate) {
                    return;
                }
            }
        }

        // Set loading state (only if not using stale data)
        if (!staleWhileRevalidate || !isCached) {
            setLoading(true);
        }

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
            const result = await fetcherRef.current();
            
            if (!isMountedRef.current) return;

            // Extract data from axios response if needed
            const fetchedData = result?.data !== undefined ? result.data : result;

            // Update state
            setData(fetchedData);
            setError(null);
            setIsCached(false);

            // Store in cache
            cacheService.set(cacheKey, fetchedData, ttl);

            // Set dependencies if provided
            if (dependencies.length > 0) {
                cacheService.setDependencies(cacheKey, dependencies);
            }

            // Call success callback
            if (onSuccessRef.current) {
                onSuccessRef.current(fetchedData);
            }
        } catch (err) {
            if (!isMountedRef.current) return;
            
            // Don't set error if request was aborted
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }

            setError(err);
            
            // Call error callback
            if (onErrorRef.current) {
                onErrorRef.current(err);
            }

            // If we have cached data, keep it on error
            const cachedData = cacheService.get(cacheKey);
            if (cachedData !== null && !data) {
                setData(cachedData);
                setIsCached(true);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [cacheKey, enabled, ttl, staleWhileRevalidate, JSON.stringify(dependencies)]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refetch function (bypasses cache)
    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch,
        isCached
    };
};

export default useCachedQuery;
