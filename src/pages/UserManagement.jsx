import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUserContext, subscribeToAuthChanges } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import '../styles/UserManagement.css';
import '../styles/Dashboard.css';
import useGlobalSearch from '../hooks/useGlobalSearch';
import API_CONFIG from '../config/api.config';
import { getRoleInitials } from '../utils/roleUtils';

const UserManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('active');

    // Auth state
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, email, isAuthenticated, firstName, lastName, status } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }

        setUserRole(role);
        setUserEmail(email);
        setUserStatus(status);

        if (firstName && lastName) {
            setUserFullName(`${firstName} ${lastName}`);
        } else {
            api.get(API_CONFIG.ENDPOINTS.GET_PROFILE)
                .then(res => {
                    const { firstName: fn, lastName: ln, status: st } = res.data;
                    setUserStatus(st);
                    if (fn && ln) {
                        setUserFullName(`${fn} ${ln}`);
                    }
                })
                .catch(() => setUserFullName(email));
        }

        // Subscribe to real-time updates
        const unsubscribe = subscribeToAuthChanges((newContext) => {
            if (newContext.firstName && newContext.lastName) {
                setUserFullName(`${newContext.firstName} ${newContext.lastName}`);
            }
            if (newContext.status !== undefined) {
                setUserStatus(newContext.status);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let url = '';
            const params = { page, size };

            switch (activeTab) {
                case 'active':
                    url = '/get-active-users';
                    break;
                case 'inactive':
                    url = '/get-inactive-users';
                    break;
                case 'all':
                    url = '/get-all-users';
                    break;
                case 'search':
                    if (!keyword.trim()) {
                        setUsers([]);
                        setTotalPages(0);
                        setTotalElements(0);
                        setLoading(false);
                        return;
                    }
                    url = '/search';
                    params.keyword = keyword;
                    break;
                default:
                    url = '/get-active-users';
            }

            const response = await api.get(url, { params });
            const data = response.data;

            setUsers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(
                err.response?.data?.message ||
                'Failed to load users. You may not have permission to access this resource.'
            );
            showSnackbar(
                err.response?.data?.message || 'Failed to load users',
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [page, size, activeTab, keyword, showSnackbar]);

    useEffect(() => {
        if (userRole) {
            fetchUsers();
        }
    }, [fetchUsers, userRole]);

    const handleToggleStatus = async (email, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        const confirmMessage = `Are you sure you want to ${action.toUpperCase()} this user?\n\nEmail: ${email}`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const endpoint = currentStatus ? '/inactivate-user' : '/activate-user';

            await api.put(endpoint, null, {
                params: { email },
            });

            showSnackbar(
                `User ${action}d successfully!`,
                'success'
            );

            fetchUsers();
        } catch (err) {
            console.error(`Error ${action}ing user:`, err);
            const errorMessage = err.response?.data?.message ||
                `You are not allowed to ${action} this user.`;

            showSnackbar(errorMessage, 'error');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setActiveTab('search');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(0);
        if (tab !== 'search') {
            setKeyword('');
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/log-out');
            navigate('/admin-login');
        } catch (err) {
            console.error('Logout error:', err);
            navigate('/admin-login');
        }
    };

    /* ================= GLOBAL SEARCH (NAVBAR) ================= */
    // Use the new shared hook for global search
    const {
        query: globalSearchQuery,
        results: globalSearchResults,
        search: handleGlobalSearchInput,
        clearSearch: clearGlobalSearch,
        isSearching: showGlobalSearchResults
    } = useGlobalSearch();

    const handleGlobalSearch = (e) => {
        handleGlobalSearchInput(e.target.value);
    };

    const navigateToGlobalResult = (item) => {
        if (item.section === 'user-management') {
            // If navigating within current page
            if (item.subSection) {
                if (item.subSection === 'active') setActiveTab('active');
                else if (item.subSection === 'inactive') setActiveTab('inactive');
                else if (item.subSection === 'all') setActiveTab('all');
            }
            clearGlobalSearch();
        } else {
            // Navigate to other dashboard sections
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo-circle">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <span>Career Vedha</span>
                </div>

                <nav className="sidebar-menu">
                    <button
                        className="menu-item"
                        onClick={() => navigate('/dashboard')}
                    >
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Overview</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => navigate('/dashboard?tab=roles')}
                    >
                        <i className="fas fa-users-gear"></i>
                        <span>Role Control</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => navigate('/dashboard?tab=permissions')}
                    >
                        <i className="fas fa-fingerprint"></i>
                        <span>Permissions</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => navigate('/dashboard?tab=quizzes')}
                    >
                        <i className="fas fa-book-open"></i>
                        <span>Quiz Manager</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => navigate('/dashboard?tab=notifications')}
                    >
                        <i className="fas fa-bell"></i>
                        <span>Notifications</span>
                    </button>

                    <button
                        className="menu-item active"
                        onClick={() => navigate('/user-management')}
                    >
                        <i className="fas fa-users-cog"></i>
                        <span>User Management</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div
                        className="user-profile-mini"
                        onClick={() => navigate('/dashboard?tab=profile')}
                        style={{ cursor: 'pointer' }}
                        title="Go to My Profile"
                    >
                        <div className="avatar">
                            {getRoleInitials(userRole)}
                        </div>
                        <div className="user-details">
                            <div className="user-name" style={{ fontSize: '0.90rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {userFullName || userEmail}
                                {userStatus !== null && <span className={`status-dot-mini ${userStatus ? 'active' : 'inactive'}`} title={userStatus ? 'Active' : 'Inactive'}></span>}
                            </div>
                            <div className="user-role-badge" style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: '2px', display: 'inline-block', opacity: 0.9 }}>
                                {userRole}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-button-alt">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                <header className="main-top-header">
                    <div className="header-search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search across portal..."
                            value={globalSearchQuery}
                            onChange={handleGlobalSearch}
                            onFocus={() => globalSearchQuery && setShowGlobalSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowGlobalSearchResults(false), 200)}
                        />

                        {showGlobalSearchResults && (
                            <div className="search-results-dropdown">
                                {globalSearchResults.length === 0 ? (
                                    <div className="search-empty">No results found for "{globalSearchQuery}"</div>
                                ) : (
                                    globalSearchResults.map(result => (
                                        <div
                                            key={result.id}
                                            className="search-item"
                                            onClick={() => navigateToGlobalResult(result)}
                                        >
                                            <div className="search-item-icon">
                                                <i className={
                                                    result.section === 'overview' ? 'fas fa-tachometer-alt' :
                                                        result.section === 'roles' ? 'fas fa-users-gear' :
                                                            result.section === 'permissions' ? 'fas fa-fingerprint' :
                                                                result.section === 'quizzes' ? 'fas fa-book-open' :
                                                                    result.section === 'notifications' ? 'fas fa-bell' : 'fas fa-hashtag'
                                                }></i>
                                            </div>
                                            <div className="search-item-info">
                                                <div className="search-item-title">{result.title}</div>
                                                <div className="search-item-path">Go to {result.section}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <div className="top-user-profile">
                            <div className="top-user-info">
                                <span className="top-user-name">{userEmail}</span>
                                <span className="top-user-role">{userRole}</span>
                            </div>
                            <div className="top-avatar">
                                {(userEmail || 'A').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-container">
                    {/* Header */}
                    <div className="um-header">
                        <div className="um-header-content">
                            <div className="um-title-section">
                                <h1 className="um-title">
                                    <i className="fas fa-users-cog"></i>
                                    User Management
                                </h1>
                                <p className="um-subtitle">Manage user accounts and permissions</p>
                            </div>
                            <div className="um-stats">
                                <div className="um-stat-card">
                                    <i className="fas fa-users"></i>
                                    <div className="um-stat-info">
                                        <span className="um-stat-value">{totalElements}</span>
                                        <span className="um-stat-label">Total Users</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs and Search in Single Row */}
                    <div className="um-filter-bar">
                        <div className="um-tabs">
                            <button
                                className={`um-tab ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => handleTabChange('active')}
                            >
                                <i className="fas fa-check-circle"></i>
                                Active Users
                            </button>

                            <button
                                className={`um-tab ${activeTab === 'inactive' ? 'active' : ''}`}
                                onClick={() => handleTabChange('inactive')}
                            >
                                <i className="fas fa-times-circle"></i>
                                Inactive Users
                            </button>

                            <button
                                className={`um-tab ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => handleTabChange('all')}
                            >
                                <i className="fas fa-list"></i>
                                All Users
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="um-search-form">
                            <div className="um-search-wrapper">
                                <i className="fas fa-search um-search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="um-search-input"
                                />
                                <button type="submit" className="um-search-btn">
                                    <i className="fas fa-search"></i>
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="um-error-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="um-loading">
                            <div className="um-spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : (
                        <>
                            {/* Users Table */}
                            <div className="um-table-container">
                                <table className="um-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <i className="fas fa-envelope"></i>
                                                Email
                                            </th>
                                            <th>
                                                <i className="fas fa-user"></i>
                                                First Name
                                            </th>
                                            <th>
                                                <i className="fas fa-user"></i>
                                                Last Name
                                            </th>
                                            <th>
                                                <i className="fas fa-shield-alt"></i>
                                                Role
                                            </th>
                                            <th>
                                                <i className="fas fa-toggle-on"></i>
                                                Status
                                            </th>
                                            <th>
                                                <i className="fas fa-cog"></i>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="um-empty-state">
                                                    <i className="fas fa-inbox"></i>
                                                    <p>No users found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.email} className="um-table-row">
                                                    <td className="um-email">{user.email}</td>
                                                    <td>{user.firstName || '-'}</td>
                                                    <td>{user.lastName || '-'}</td>
                                                    <td>
                                                        <span className={`um-role-badge ${user.role.toLowerCase()}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`um-status-badge ${user.status ? 'active' : 'inactive'}`}>
                                                            <i className={`fas ${user.status ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                                            {user.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={`um-action-btn ${user.status ? 'deactivate' : 'activate'}`}
                                                            onClick={() => handleToggleStatus(user.email, user.status)}
                                                        >
                                                            <i className={`fas ${user.status ? 'fa-ban' : 'fa-check'}`}></i>
                                                            {user.status ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="um-pagination">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                        className="um-page-btn"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                        Previous
                                    </button>

                                    <div className="um-page-info">
                                        <span className="um-page-current">Page {page + 1}</span>
                                        <span className="um-page-separator">of</span>
                                        <span className="um-page-total">{totalPages}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1}
                                        className="um-page-btn"
                                    >
                                        Next
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
