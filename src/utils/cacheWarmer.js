import api from '../services/api';
import cacheService, { CACHE_TTL } from '../services/cacheService';

/**
 * Cache Warmer Utility
 * Pre-loads critical data into cache on app initialization
 */

class CacheWarmer {
    constructor() {
        this.isWarming = false;
    }

    /**
     * Warm cache with user profile data
     */
    async warmUserProfile() {
        try {
            const response = await api.get('/get-profile');
            cacheService.set('user-profile', response.data, CACHE_TTL.USER_PROFILE);
            console.log('[Cache Warmer] User profile cached');
        } catch (err) {
            console.warn('[Cache Warmer] Failed to warm user profile cache:', err.message);
        }
    }

    /**
     * Warm cache with active notifications (first page)
     */
    async warmNotifications(userRole) {
        if (!userRole) return;
        
        try {
            const response = await api.get('/notifications', {
                params: { size: 20 }
            });
            cacheService.set(
                `notifications-pending-page-0`,
                response.data,
                CACHE_TTL.NOTIFICATIONS
            );
            console.log('[Cache Warmer] Notifications cached');
        } catch (err) {
            console.warn('[Cache Warmer] Failed to warm notifications cache:', err.message);
        }
    }

    /**
     * Warm cache with roles list
     */
    async warmRoles() {
        try {
            const response = await api.get('/role-names');
            cacheService.set('roles-list', response.data, CACHE_TTL.ROLES);
            console.log('[Cache Warmer] Roles list cached');
        } catch (err) {
            console.warn('[Cache Warmer] Failed to warm roles cache:', err.message);
        }
    }

    /**
     * Warm cache with permissions list
     */
    async warmPermissions() {
        try {
            const response = await api.get('/permission-names');
            cacheService.set('permissions-list', response.data, CACHE_TTL.PERMISSIONS);
            console.log('[Cache Warmer] Permissions list cached');
        } catch (err) {
            console.warn('[Cache Warmer] Failed to warm permissions cache:', err.message);
        }
    }

    /**
     * Warm cache with active users (first page)
     */
    async warmActiveUsers() {
        try {
            const response = await api.get('/get-active-users', {
                params: { page: 0, size: 10 }
            });
            cacheService.set(
                'users-active-page-0',
                response.data,
                CACHE_TTL.USER_LIST
            );
            console.log('[Cache Warmer] Active users cached');
        } catch (err) {
            console.warn('[Cache Warmer] Failed to warm active users cache:', err.message);
        }
    }

    /**
     * Warm all critical caches on login
     */
    async warmOnLogin(userRole) {
        if (this.isWarming) {
            console.log('[Cache Warmer] Already warming cache, skipping...');
            return;
        }

        this.isWarming = true;
        console.log('[Cache Warmer] Starting cache warming...');

        try {
            // Warm caches in parallel for faster loading
            await Promise.allSettled([
                this.warmUserProfile(),
                this.warmNotifications(userRole),
                this.warmRoles(),
                this.warmPermissions(),
                this.warmActiveUsers()
            ]);

            console.log('[Cache Warmer] Cache warming complete');
        } catch (err) {
            console.error('[Cache Warmer] Error during cache warming:', err);
        } finally {
            this.isWarming = false;
        }
    }

    /**
     * Clear all warmed caches (useful on logout)
     */
    clearAll() {
        cacheService.clear();
        console.log('[Cache Warmer] All caches cleared');
    }
}

// Create singleton instance
const cacheWarmer = new CacheWarmer();

export default cacheWarmer;
