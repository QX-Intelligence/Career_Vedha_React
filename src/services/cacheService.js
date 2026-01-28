/**
 * Advanced Cache Management Service
 * 
 * Features:
 * - TTL (Time-To-Live) based expiration
 * - LRU (Least Recently Used) eviction
 * - Pattern-based invalidation
 * - Dependency tracking for related data
 * - Cache statistics and monitoring
 */

class CacheService {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 100; // Maximum number of cache entries
        this.defaultTTL = options.defaultTTL || 300000; // 5 minutes default
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0
        };
        this.dependencies = new Map(); // Track cache dependencies
    }

    /**
     * Generate a cache key from endpoint and parameters
     */
    generateKey(endpoint, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
        
        return `${endpoint}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Get data from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Update access time for LRU
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        
        return entry.data;
    }

    /**
     * Set data in cache with TTL
     */
    set(key, data, ttl = this.defaultTTL) {
        // Evict if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const entry = {
            data,
            expiresAt: Date.now() + ttl,
            lastAccessed: Date.now(),
            createdAt: Date.now()
        };

        this.cache.set(key, entry);
        this.stats.sets++;
    }

    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Invalidate a specific cache entry
     */
    invalidate(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.invalidations++;
        }
        return deleted;
    }

    /**
     * Invalidate all cache entries matching a pattern
     * Pattern can be a string prefix or regex
     */
    invalidatePattern(pattern) {
        let count = 0;
        const regex = typeof pattern === 'string' 
            ? new RegExp(`^${pattern.replace(/\*/g, '.*')}`)
            : pattern;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }

        this.stats.invalidations += count;
        return count;
    }

    /**
     * Invalidate related caches based on dependencies
     */
    invalidateRelated(keys) {
        const keysToInvalidate = new Set(Array.isArray(keys) ? keys : [keys]);
        
        // Find all dependent keys
        for (const [key, deps] of this.dependencies.entries()) {
            for (const dep of deps) {
                if (keysToInvalidate.has(dep)) {
                    keysToInvalidate.add(key);
                }
            }
        }

        // Invalidate all related keys
        let count = 0;
        for (const key of keysToInvalidate) {
            if (this.invalidate(key)) {
                count++;
            }
        }

        return count;
    }

    /**
     * Set cache dependencies
     * When any of the dependency keys are invalidated, this key will also be invalidated
     */
    setDependencies(key, dependencies) {
        this.dependencies.set(key, Array.isArray(dependencies) ? dependencies : [dependencies]);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.dependencies.clear();
        this.stats.invalidations += size;
        return size;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
            missRate: total > 0 ? (this.stats.misses / total * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0
        };
    }

    /**
     * Get all cache keys (for debugging)
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Get remaining TTL for a cache entry (in milliseconds)
     */
    getTTL(key) {
        const entry = this.cache.get(key);
        if (!entry) return -1;
        
        const remaining = entry.expiresAt - Date.now();
        return remaining > 0 ? remaining : 0;
    }
}

// Create singleton instance
const cacheService = new CacheService({
    maxSize: 100,
    defaultTTL: 300000 // 5 minutes
});

// Cache invalidation rules for different endpoints
export const CACHE_INVALIDATION_RULES = {
    // User mutations
    '/activate-user': ['users-*'],
    '/inactivate-user': ['users-*'],
    '/change-role': ['users-*', 'roles-*'],
    
    // Role mutations
    '/create-role': ['roles-*', 'permissions-*'],
    '/inactivate-role': ['roles-*', 'permissions-*'],
    
    // Permission mutations
    '/create-permission': ['permissions-*'],
    '/add-permission': ['permissions-*', 'roles-*'],
    '/remove-permission': ['permissions-*', 'roles-*'],
    
    // Notification mutations
    '/approve-request': ['notifications-*', 'users-*'],
    '/reject-request': ['notifications-*'],
    '/mark-as-seen': ['notifications-*'],
    '/mark-all-seen': ['notifications-*'],
    
    // Article mutations
    '/create-article': ['articles-*', 'home-*'],
    '/update-article': ['articles-*', 'home-*'],
    '/delete-article': ['articles-*', 'home-*'],
    '/activate-article': ['articles-*', 'home-*'],
    '/deactivate-article': ['articles-*', 'home-*'],
    
    // Quiz mutations
    '/create-question': ['questions-*', 'quiz-*'],
    '/update-question': ['questions-*', 'quiz-*'],
    '/delete-question': ['questions-*', 'quiz-*'],
    '/bulk-delete-questions': ['questions-*', 'quiz-*'],
    
    // Job mutations
    '/create-job': ['jobs-*'],
    '/update-job': ['jobs-*'],
    '/delete-job': ['jobs-*']
};

// TTL configurations for different data types
export const CACHE_TTL = {
    NOTIFICATIONS: 30000,      // 30 seconds (near real-time)
    USER_PROFILE: 600000,      // 10 minutes
    USER_LIST: 300000,         // 5 minutes
    ROLES: 300000,             // 5 minutes
    PERMISSIONS: 300000,       // 5 minutes
    ARTICLES: 300000,          // 5 minutes
    QUESTIONS: 600000,         // 10 minutes
    JOBS: 300000,              // 5 minutes
    HOME_DATA: 180000,         // 3 minutes
    DEFAULT: 300000            // 5 minutes
};

export default cacheService;
