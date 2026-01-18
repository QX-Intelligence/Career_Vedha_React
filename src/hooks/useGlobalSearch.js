import { useState, useCallback } from 'react';

/**
 * Hook for global search functionality.
 * 
 * @param {Object} config - Configuration object
 * @param {Array} config.extraItems - Additional dynamic items to include in search (optional)
 * @returns {Object} - { query, setQuery, results, search, isSearching }
 */
const useGlobalSearch = ({ extraItems = [] } = {}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Static Navigation Items - Single Source of Truth for App Navigation Search
    const STATIC_NAV_ITEMS = [
        // Dashboard & Overview
        { id: 'overview', title: 'Dashboard Overview', keywords: ['summary', 'stats', 'activity', 'overview', 'dashboard', 'welcome'], section: 'overview' },
        { id: 'approvals', title: 'Recent Activity / Pending Requests', keywords: ['pending', 'approvals', 'requests', 'registration', 'new user', 'recent'], section: 'overview' },
        { id: 'role-ov', title: 'Roles & Permissions Overview', keywords: ['roles', 'permissions', 'access', 'management summary'], section: 'overview' },

        // Role Control
        { id: 'rc-main', title: 'Role Control Center', keywords: ['manage definitions', 'role control', 'rc'], section: 'roles' },
        { id: 'rc-create', title: 'Create New Role', keywords: ['add role', 'new role definition'], section: 'roles' },
        { id: 'rc-inactivate', title: 'Inactivate / Deactivate Role', keywords: ['inactivate', 'deactivate', 'remove role', 'disable'], section: 'roles' },

        // Permissions
        { id: 'perm-main', title: 'Permissions Management', keywords: ['granular rights', 'api access'], section: 'permissions' },
        { id: 'perm-policy', title: 'Policy Definition', keywords: ['create permission', 'new policy', 'define right'], section: 'permissions' },
        { id: 'perm-mapping', title: 'Mapping & Assignment', keywords: ['mapping', 'assignment', 'attach permission', 'link role'], section: 'permissions' },

        // Quizzes
        { id: 'quizzes', title: 'Quiz Manager', keywords: ['exam', 'questions', 'bank', 'quiz', 'quizzes', 'publish', 'batch creator'], section: 'quizzes' },
        { id: 'quiz-new', title: 'Quiz: New Question', keywords: ['new question', 'create exam', 'add quiz'], section: 'quizzes' },
        { id: 'quiz-test', title: 'Quiz: Student View', keywords: ['test view', 'student view', 'preview exam'], section: 'quizzes' },

        // Notifications
        { id: 'notif-main', title: 'Notifications Center', keywords: ['alerts', 'notifications', 'messages', 'seen', 'unseen', 'bell'], section: 'notifications' },
        { id: 'notif-archive', title: 'Notification Archive', keywords: ['history', 'older', 'past', 'archive', 'records', 'logs'], section: 'notifications' },

        // User Management
        { id: 'user-mgmt', title: 'User Management', keywords: ['users', 'accounts', 'manage users', 'admin', 'profiles'], section: 'user-management' },
        { id: 'user-active', title: 'Active Users', keywords: ['active users', 'active accounts', 'enabled users'], section: 'user-management', subSection: 'active' },
        { id: 'user-inactive', title: 'Inactive Users', keywords: ['inactive users', 'disabled accounts', 'banned users'], section: 'user-management', subSection: 'inactive' },
        { id: 'user-all', title: 'All Users Directory', keywords: ['all users', 'user list', 'full directory'], section: 'user-management', subSection: 'all' },

        // Profile
        { id: 'profile', title: 'My Profile', keywords: ['profile', 'account', 'edit profile', 'my account', 'avatar'], section: 'profile' },
    ];

    const search = useCallback((searchQuery) => {
        setQuery(searchQuery);

        if (!searchQuery || !searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const normalizedQuery = searchQuery.toLowerCase().trim();

        // Combine static items with any dynamic extra items passed to the hook
        const allItems = [...STATIC_NAV_ITEMS, ...extraItems];

        const filtered = allItems.filter(item => {
            // Check title
            if (item.title && item.title.toLowerCase().includes(normalizedQuery)) return true;

            // Check keywords
            if (item.keywords && Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(normalizedQuery))) {
                return true;
            }

            // Check specific dynamic fields if present (like message for notifications)
            if (item.message && item.message.toLowerCase().includes(normalizedQuery)) return true;

            return false;
        });

        setResults(filtered);
    }, [extraItems]);

    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setIsSearching(false);
    }, []);

    return {
        query,
        results,
        search,
        clearSearch,
        isSearching
    };
};

export default useGlobalSearch;
