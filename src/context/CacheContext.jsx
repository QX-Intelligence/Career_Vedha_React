import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import cacheService from '../services/cacheService';

const CacheContext = createContext(null);

export const CacheProvider = ({ children }) => {
    const [stats, setStats] = useState(cacheService.getStats());
    const [isEnabled, setIsEnabled] = useState(true);

    // Update stats periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(cacheService.getStats());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const invalidate = useCallback((key) => {
        if (!isEnabled) return false;
        return cacheService.invalidate(key);
    }, [isEnabled]);

    const invalidatePattern = useCallback((pattern) => {
        if (!isEnabled) return 0;
        return cacheService.invalidatePattern(pattern);
    }, [isEnabled]);

    const invalidateRelated = useCallback((keys) => {
        if (!isEnabled) return 0;
        return cacheService.invalidateRelated(keys);
    }, [isEnabled]);

    const clearCache = useCallback(() => {
        return cacheService.clear();
    }, []);

    const resetStats = useCallback(() => {
        cacheService.resetStats();
        setStats(cacheService.getStats());
    }, []);

    const toggleCache = useCallback((enabled) => {
        setIsEnabled(enabled);
        if (!enabled) {
            cacheService.clear();
        }
    }, []);

    const value = {
        stats,
        isEnabled,
        invalidate,
        invalidatePattern,
        invalidateRelated,
        clearCache,
        resetStats,
        toggleCache,
        cacheService // Expose service for advanced usage
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};

export default CacheContext;
