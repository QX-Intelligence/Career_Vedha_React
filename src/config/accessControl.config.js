export const MODULES = {
    ROLE_CONTROL: 'ROLE_CONTROL',
    PERMISSIONS: 'PERMISSIONS',
    QUIZ_MANAGER: 'QUIZ_MANAGER',
    NOTIFICATIONS: 'NOTIFICATIONS',
    OVERVIEW_STATS: 'OVERVIEW_STATS',
    APPROVALS: 'APPROVALS',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    ARTICLE_MANAGEMENT: 'ARTICLE_MANAGEMENT',
    JOB_MANAGEMENT: 'JOB_MANAGEMENT',
    MEDIA_MANAGEMENT: 'MEDIA_MANAGEMENT'
};

// Define access for non-super roles. Super Admin has wildcard access.
export const ROLE_PERMISSIONS = {
    ADMIN: [
        MODULES.ROLE_CONTROL, 
        MODULES.PERMISSIONS, 
        MODULES.QUIZ_MANAGER, 
        MODULES.NOTIFICATIONS, 
        MODULES.OVERVIEW_STATS, 
        MODULES.APPROVALS, 
        MODULES.USER_MANAGEMENT, 
        MODULES.ARTICLE_MANAGEMENT, 
        MODULES.JOB_MANAGEMENT,
        MODULES.MEDIA_MANAGEMENT
    ],
    CONTRIBUTOR: [MODULES.ARTICLE_MANAGEMENT, MODULES.OVERVIEW_STATS, MODULES.MEDIA_MANAGEMENT],
    EDITOR: [MODULES.ARTICLE_MANAGEMENT, MODULES.OVERVIEW_STATS, MODULES.MEDIA_MANAGEMENT],
    PUBLISHER: [MODULES.ARTICLE_MANAGEMENT, MODULES.QUIZ_MANAGER, MODULES.OVERVIEW_STATS, MODULES.JOB_MANAGEMENT, MODULES.MEDIA_MANAGEMENT],
    // Legacy support
    CREATOR: [MODULES.QUIZ_MANAGER, MODULES.OVERVIEW_STATS],
};

/**
 * Checks if a user role has access to a specific module.
 * @param {string} userRole - The role of the user.
 * @param {string} module - The module to check access for.
 * @returns {boolean} - True if access is granted, false otherwise.
 */
export const checkAccess = (userRole, module) => {
    if (!userRole) {
        // Reduced noise, but kept as a subtle indicator for devs
        // console.debug('[AccessControl] No userRole provided yet');
        return false;
    }
    if (!module) {
        console.warn('[AccessControl] No module provided for checkAccess');
        return false;
    }
    
    if (userRole === 'SUPER_ADMIN') return true;
    
    const allowedModules = ROLE_PERMISSIONS[userRole] || [];
    const hasAccess = allowedModules.includes(module);
    
    if (!hasAccess) {
        // Helpful for debugging why something isn't showing up
        // console.debug(`[AccessControl] Role ${userRole} denied access to ${module}`);
    }
    
    return hasAccess;
};
