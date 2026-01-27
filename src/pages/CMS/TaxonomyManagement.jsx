import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUserContext, subscribeToAuthChanges } from '../../services/api';
import { newsService } from '../../services';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../services/notificationService';
import { useSnackbar } from '../../context/SnackbarContext';
import { getRoleInitials } from '../../utils/roleUtils';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import API_CONFIG from '../../config/api.config';
import '../../styles/Dashboard.css';

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

const TaxonomyManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    // Auth state
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [loading, setLoading] = useState(false);
    const [taxonomies, setTaxonomies] = useState([]);
    const [activeSection, setActiveSection] = useState('academics');

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

    const sections = [
        { id: 'academics', name: 'Academics' },
        { id: 'jobs', name: 'Jobs' },
        { id: 'tech', name: 'Tech' },
        { id: 'business', name: 'Business' }
    ];

    const loadNotifications = useCallback(async () => {
        try {
            const data = await fetchNotifications(0, 10);
            setNotificationFeed(data.content || []);
            setOverallUnseenCount(data.totalUnseen || 0);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    }, []);

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
            await rejectRequest(id, "Rejected from taxonomy management");
            showSnackbar("Request rejected", "success");
            loadNotifications();
        } catch (err) {
            showSnackbar("Failed to reject request", "error");
        }
    };

    const {
        query: globalSearchQuery,
        results: globalSearchResults,
        search: handleGlobalSearchInput,
        clearSearch: clearGlobalSearch,
        isSearching: showGlobalSearchResults,
        setIsSearching: setShowGlobalSearchResults
    } = useGlobalSearch();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const { role, email, isAuthenticated, firstName, lastName, status } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'];

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

    useEffect(() => {
        if (userRole) {
            fetchTaxonomy(activeSection);
        }
    }, [activeSection, userRole]);

    const fetchTaxonomy = async (section) => {
        setLoading(true);
        try {
            const data = await newsService.getTaxonomyBySection(section);
            setTaxonomies(data);
        } catch (error) {
            showSnackbar('Failed to load taxonomy', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/log-out');
            navigate('/admin-login');
        } catch (err) {
            navigate('/admin-login');
        }
    };

    const navigateToGlobalResult = (item) => {
        if (item.section === 'cms/taxonomy') {
            clearGlobalSearch();
        } else if (item.section === 'user-management') {
            navigate('/user-management');
            clearGlobalSearch();
        } else {
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    return (
        <div className="dashboard-wrapper">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo-circle">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <span>Career Vedha</span>
                </div>

                <nav className="sidebar-menu">
                    <button className="menu-item" onClick={() => navigate('/dashboard')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Overview</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/dashboard?tab=roles')}>
                        <i className="fas fa-users-gear"></i>
                        <span>Role Control</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/dashboard?tab=permissions')}>
                        <i className="fas fa-fingerprint"></i>
                        <span>Permissions</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/dashboard?tab=quizzes')}>
                        <i className="fas fa-book-open"></i>
                        <span>Quiz Manager</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/dashboard?tab=notifications')}>
                        <i className="fas fa-bell"></i>
                        <span>Notifications</span>
                    </button>

                    <button className="menu-item" onClick={() => navigate('/user-management')}>
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
                                <button className="menu-item active" onClick={() => navigate('/cms/taxonomy')}>
                                    <i className="fas fa-tags"></i>
                                    <span>Taxonomy</span>
                                </button>
                            )}
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-mini" onClick={() => navigate('/dashboard?tab=profile')} style={{ cursor: 'pointer' }}>
                        <div className="avatar">{getRoleInitials(userRole)}</div>
                        <div className="user-details">
                            <div className="user-name">
                                {userFullName || userEmail}
                                {userStatus !== null && <span className={`status-dot-mini ${userStatus ? 'active' : 'inactive'}`}></span>}
                            </div>
                            <div className="user-role-badge">{userRole}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-button-alt">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div className="dashboard-main">
                <header className="main-top-header">
                    <div className="header-search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search across portal..."
                            value={globalSearchQuery}
                            onChange={(e) => handleGlobalSearchInput(e.target.value)}
                            onFocus={() => globalSearchQuery && setShowGlobalSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowGlobalSearchResults(false), 200)}
                        />

                        {showGlobalSearchResults && (
                            <div className="search-results-dropdown">
                                {globalSearchResults.length === 0 ? (
                                    <div className="search-empty">No results found for "{globalSearchQuery}"</div>
                                ) : (
                                    globalSearchResults.map(result => (
                                        <div key={result.id} className="search-item" onClick={() => navigateToGlobalResult(result)}>
                                            <div className="search-item-icon">
                                                <i className="fas fa-hashtag"></i>
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
                    <div className="cms-header-row">
                        <div className="cms-title-area">
                            <h1>Taxonomy Management</h1>
                            <p>Manage categories and tags across the platform</p>
                        </div>
                    </div>

                    <div className="cms-table-controls">
                        <div className="cms-tabs">
                            {sections.map(section => (
                                <button 
                                    key={section.id}
                                    className={activeSection === section.id ? 'active' : ''} 
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cms-table-container glass-card">
                        {loading ? (
                            <div className="cms-loading">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Fetching taxonomies...</p>
                            </div>
                        ) : (
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Slug</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxonomies.length > 0 ? (
                                        taxonomies.map((tax, idx) => (
                                            <tr key={tax.id || idx}>
                                                <td>#{tax.id || (idx + 1)}</td>
                                                <td><strong>{tax.name}</strong></td>
                                                <td>{tax.slug}</td>
                                                <td><span className="type-tag">{tax.section || activeSection}</span></td>
                                                <td>{tax.description || 'No description available'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="no-data">No taxonomy records found for this section</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxonomyManagement;
