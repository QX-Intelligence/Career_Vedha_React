import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUserContext, subscribeToAuthChanges } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import '../styles/UserManagement.css';
import '../styles/Dashboard.css';
import useGlobalSearch from '../hooks/useGlobalSearch';
import API_CONFIG from '../config/api.config';
import { getRoleInitials } from '../utils/roleUtils';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../services/notificationService';
import CustomSelect from '../components/ui/CustomSelect';

const UserManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    const PopoverItem = React.memo(({ notification, onApprove, onReject, onMarkSeen }) => {
        const n = notification;
        return (
            <div key={n.id} className="popover-item">
                <div className="popover-item-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong>New Request</strong>
                        <button className="item-seen-btn" onClick={() => onMarkSeen(n.id)} title="Mark as read">
                            <i className="fas fa-eye"></i>
                        </button>
                    </div>
                    <p>{n.message}</p>
                </div>
                <div className="popover-actions">
                    <button className="popover-btn-approve" onClick={() => onApprove(n.id)}>Approve</button>
                    <button className="popover-btn-reject" onClick={() => onReject(n.id)}>Reject</button>
                </div>
            </div>
        );
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    // Notifications state
    const [notificationFeed, setNotificationFeed] = useState([]);
    const [overallUnseenCount, setOverallUnseenCount] = useState(0);
    const [showPopover, setShowPopover] = useState(false);
    const notificationContainerRef = useRef(null);
    const [suppressedNotificationIds, setSuppressedNotificationIds] = useState(() => {
        try {
            const saved = localStorage.getItem('cv_suppressed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [lastSeenAllAt, setLastSeenAllAt] = useState(() => {
        return localStorage.getItem('cv_last_seen_all') || null;
    });


    // Auth state
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);

    // Role Change state
    const [availableRoles, setAvailableRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [isSavingRole, setIsSavingRole] = useState(false);

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

    const fetchRoles = useCallback(async () => {
        if (userRole !== 'SUPER_ADMIN') return;
        try {
            const response = await api.get('/role-names');
            setAvailableRoles(response.data || []);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole === 'SUPER_ADMIN') {
            fetchRoles();
        }
    }, [userRole, fetchRoles]);

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const handleSaveRole = async () => {
        if (!selectedUser || !newRole) return;
        if (newRole === selectedUser.role) {
            setShowRoleModal(false);
            return;
        }

        setIsSavingRole(true);
        try {
            await api.put('/change-role', null, {
                params: {
                    email: selectedUser.email,
                    roleName: newRole
                }
            });
            showSnackbar('Role updated successfully!', 'success');
            fetchUsers();
            setShowRoleModal(false);
        } catch (err) {
            console.error('Error updating role:', err);
            showSnackbar(err.response?.data?.message || 'Failed to update role', 'error');
        } finally {
            setIsSavingRole(false);
        }
    };

    const loadNotifications = useCallback(async () => {
        try {
            const data = await fetchNotifications(userRole, { size: 10 });
            setNotificationFeed(data.content || []);
            setOverallUnseenCount(data.totalUnseen || 0);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole) {
            loadNotifications();
        }
    }, [userRole, loadNotifications]);

    const handleMarkAsSeen = async (id) => {
        try {
            await markAsSeen(id);
            setSuppressedNotificationIds(prev => [...prev, id]);
            setOverallUnseenCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            showSnackbar("Failed to mark notification as seen", "error");
        }
    };

    const handleMarkAllSeen = async () => {
        try {
            await markAllAsSeen();
            const now = new Date().toISOString();
            setLastSeenAllAt(now);
            localStorage.setItem('cv_last_seen_all', now);
            setOverallUnseenCount(0);
            setShowPopover(false);
        } catch (err) {
            showSnackbar("Failed to mark all as seen", "error");
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveRequest(id);
            showSnackbar("Request approved", "success");
            loadNotifications();
        } catch (err) {
            showSnackbar("Failed to approve request", "error");
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectRequest(id, "Rejected from user management");
            showSnackbar("Request rejected", "success");
            loadNotifications();
        } catch (err) {
            showSnackbar("Failed to reject request", "error");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

                    <div className="sidebar-divider" style={{ height: '1px', background: 'rgba(226, 232, 240, 0.5)', margin: '15px 24px' }}></div>

                    <div 
                        className="sidebar-group-label" 
                        onClick={() => setIsCmsOpen(!isCmsOpen)}
                        style={{ 
                            padding: '20px 24px 10px', 
                            fontSize: '0.7rem', 
                            fontWeight: '800', 
                            color: '#94a3b8', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <span>CMS</span>
                        <i className={`fas fa-chevron-${isCmsOpen ? 'down' : 'right'}`} style={{ fontSize: '0.6rem' }}></i>
                    </div>

                    {isCmsOpen && (
                        <>
                            <button className="menu-item" onClick={() => navigate('/dashboard?tab=articles')}>
                                <i className="fas fa-file-invoice"></i>
                                <span>Articles</span>
                            </button>
                            <button className="menu-item" onClick={() => navigate('/cms/jobs')}>
                                <i className="fas fa-briefcase"></i>
                                <span>Jobs</span>
                            </button>
                            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                                <button className="menu-item" onClick={() => navigate('/cms/taxonomy')}>
                                    <i className="fas fa-tags"></i>
                                    <span>Taxonomy</span>
                                </button>
                            )}
                        </>
                    )}
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
                        <div className="notification-bell-container" ref={notificationContainerRef}>
                            <div className="notification-bell" onClick={() => setShowPopover(!showPopover)}>
                                <i className="fas fa-bell"></i>
                                {overallUnseenCount > 0 && (
                                    <span className="bell-badge">{overallUnseenCount > 15 ? '15+' : overallUnseenCount}</span>
                                )}
                            </div>

                            {showPopover && (
                                <div className="notification-popover">
                                    <div className="popover-header">
                                        <span>New Alerts ({overallUnseenCount})</span>
                                        {overallUnseenCount > 0 && (
                                            <button className="mark-all-btn" onClick={handleMarkAllSeen}>Mark all seen</button>
                                        )}
                                    </div>
                                    <div className="popover-list">
                                        {overallUnseenCount === 0 ? (
                                            <div className="popover-empty">
                                                <i className="fas fa-bell-slash"></i>
                                                <p>No new alerts</p>
                                            </div>
                                        ) : (
                                            notificationFeed.filter(n => {
                                                const ts = n.localDateTime || n.timestamp;
                                                const isSeenLocally = lastSeenAllAt && ts && new Date(ts) <= new Date(lastSeenAllAt);
                                                const isSeen = n.seen || n.isSeen || n.read || n.isRead || n.status === 'READ' || suppressedNotificationIds.includes(n.id) || isSeenLocally;
                                                return !isSeen;
                                            }).slice(0, 10).map(n => (
                                                <PopoverItem
                                                    key={n.id}
                                                    notification={n}
                                                    onApprove={handleApprove}
                                                    onReject={handleReject}
                                                    onMarkSeen={handleMarkAsSeen}
                                                />
                                            ))
                                        )}
                                    </div>
                                    <div className="popover-footer" onClick={() => { setShowPopover(false); navigate('/dashboard?tab=notifications'); }}>
                                        View All History
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="top-user-profile">
                            <div className="top-user-info">
                                <span className="top-user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {userFullName || userEmail}
                                    {userStatus !== null && <span className={`status-dot-mini ${userStatus ? 'active' : 'inactive'}`} title={userStatus ? 'Active' : 'Inactive'}></span>}
                                </span>
                                <span className="top-user-role">{userRole}</span>
                            </div>
                            <div className="top-avatar">
                                {getRoleInitials(userRole)}
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
                                                        <div className="um-action-buttons">
                                                            <button
                                                                className={`um-action-btn ${user.status ? 'deactivate' : 'activate'}`}
                                                                onClick={() => handleToggleStatus(user.email, user.status)}
                                                                title={user.status ? 'Deactivate User' : 'Activate User'}
                                                            >
                                                                <i className={`fas ${user.status ? 'fa-ban' : 'fa-check'}`}></i>
                                                            </button>

                                                            {userRole === 'SUPER_ADMIN' && (
                                                                <button
                                                                    className="um-action-btn change-role"
                                                                    onClick={() => openRoleModal(user)}
                                                                    title="Change Role"
                                                                >
                                                                    <i className="fas fa-user-shield"></i>
                                                                </button>
                                                            )}
                                                        </div>
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

            {/* Role Change Modal */}
            {showRoleModal && (
                <div className="um-modal-overlay">
                    <div className="um-modal">
                        <div className="um-modal-header">
                            <h3>Change University Role</h3>
                            <button className="um-modal-close" onClick={() => setShowRoleModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="um-modal-body">
                            <div className="um-modal-user">
                                User: <strong>{selectedUser?.email}</strong>
                            </div>
                            <div className="um-form-group">
                                <CustomSelect
                                    label="Assign New Role"
                                    options={availableRoles}
                                    value={newRole}
                                    onChange={(val) => setNewRole(val)}
                                    disabled={isSavingRole}
                                    placeholder="Select a role..."
                                    icon="fas fa-shield-alt"
                                />
                            </div>
                        </div>
                        <div className="um-modal-footer">
                            <button 
                                className="um-btn-cancel" 
                                onClick={() => setShowRoleModal(false)}
                                disabled={isSavingRole}
                            >
                                Cancel
                            </button>
                            <button 
                                className="um-btn-save" 
                                onClick={handleSaveRole}
                                disabled={isSavingRole || newRole === selectedUser?.role}
                            >
                                {isSavingRole ? <i className="fas fa-spinner fa-spin"></i> : 'Update Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
