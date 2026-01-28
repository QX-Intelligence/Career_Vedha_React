import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LuxuryTooltip from '../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../services/api';
import { jobsService } from '../../services/jobsService';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../services/notificationService';
import { useSnackbar } from '../../context/SnackbarContext';
import { getRoleInitials } from '../../utils/roleUtils';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import API_CONFIG from '../../config/api.config';
import '../../styles/ArticleManagement.css';
import './JobsManagement.css';

const PopoverItem = React.memo(({ notification, onApprove, onReject, onMarkSeen }) => {
    const n = notification;
    return (
        <div key={n.id} className="popover-item">
            <div className="popover-item-text">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong>New Request</strong>
                    <LuxuryTooltip content="Mark as read" position="left">
                        <button className="item-seen-btn" onClick={() => onMarkSeen(n.id)}>
                            <i className="fas fa-eye"></i>
                        </button>
                    </LuxuryTooltip>
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

const JobsManagement = () => {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [searchQuery, setSearchQuery] = useState('');

    // Auth state
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);
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
            await rejectRequest(id, "Rejected from jobs management");
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

    /* ================= AUTH CHECK ================= */
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

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Using admin API cms/jobs/list/ which returns { total, results, limit, offset }
            const data = await jobsService.getAdminJobs({ limit: 100 });
            const results = data.results || [];
            
            // DEBUG: Log the first job to see what fields we actually have
            if (results.length > 0) {
                console.log('[JobsManagement] Sample job data:', results[0]);
            }
            
            setJobs(results);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showSnackbar('Failed to fetch jobs', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userRole) {
            fetchJobs();
        }
    }, [userRole]);

    const handleAction = async (jobId, action) => {
        try {
            if (action === 'activate') {
                await jobsService.activateJob(jobId);
                showSnackbar('Job activated successfully', 'success');
            } else if (action === 'deactivate') {
                await jobsService.deactivateJob(jobId);
                showSnackbar('Job deactivated successfully', 'success');
            }
            // Add a small delay to allow backend to process if needed, then fetch
            setTimeout(() => fetchJobs(), 500);
        } catch (error) {
            showSnackbar(`Failed to ${action} job`, 'error');
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

    const filteredJobs = jobs.filter(job => {
        // Simplified status check using backend provided fields
        const isActive = job.status_display?.toUpperCase() === 'ACTIVE' || job.status === 1 || job.is_active || job.isActive;
        const title = job.title || '';
        const org = job.organization || '';
        
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               org.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'ACTIVE') return matchesSearch && isActive;
        if (activeTab === 'INACTIVE') return matchesSearch && !isActive;
        return matchesSearch;
    });

    const navigateToGlobalResult = (item) => {
        if (item.section === 'jobs') {
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
                            <button className="menu-item active" onClick={() => navigate('/cms/jobs')}>
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
                                    {userStatus !== null && (
                                        <LuxuryTooltip content={userStatus ? 'Active' : 'Inactive'}>
                                            <span className={`status-dot-mini ${userStatus ? 'active' : 'inactive'}`}></span>
                                        </LuxuryTooltip>
                                    )}
                                </span>
                                <span className="top-user-role">{userRole}</span>
                            </div>
                            <div className="top-avatar">
                                {getRoleInitials(userRole)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-container section-fade-in">
                    <div className="am-header">
                        <div className="am-title-section">
                            <h1 className="am-title">
                                <i className="fas fa-briefcase"></i>
                                Jobs Management
                            </h1>
                            <p className="am-subtitle">Create, track and manage job postings</p>
                        </div>
                        <button className="m-btn-primary" onClick={() => navigate('/cms/jobs/create')}>
                            <i className="fas fa-plus"></i> Post New Job
                        </button>
                    </div>

                    <div className="am-filter-bar">
                        <div className="am-tabs">
                            <button className={`am-tab ${activeTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('ACTIVE')}>
                                <i className="fas fa-check-circle"></i> Active
                                <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                                    {jobs.filter(j => {
                                        const isActive = j.status_display?.toUpperCase() === 'ACTIVE' || j.status === 1 || j.is_active || j.isActive;
                                        return isActive;
                                    }).length}
                                </span>
                            </button>
                            <button className={`am-tab ${activeTab === 'INACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('INACTIVE')}>
                                <i className="fas fa-eye-slash"></i> Inactive
                                <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                                    {jobs.filter(j => {
                                        const isActive = j.status_display?.toUpperCase() === 'ACTIVE' || j.status === 1 || j.is_active || j.isActive;
                                        return !isActive;
                                    }).length}
                                </span>
                            </button>
                            <button className={`am-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
                                <i className="fas fa-list"></i> All Jobs
                                <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                                    {jobs.length}
                                </span>
                            </button>
                        </div>
                        <div className="am-search-form">
                            <div className="am-search-wrapper">
                                <i className="fas fa-search am-search-icon"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search by title or organization..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="am-search-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        {loading ? (
                            <div className="am-loading">
                                <i className="fas fa-spinner fa-spin fa-2x"></i>
                                <p>Syncing job records...</p>
                            </div>
                        ) : (
                            <div className="am-table-container">
                                <table className="am-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Job Title</th>
                                            <th>Organization</th>
                                            <th>Type</th>
                                            <th>Location</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredJobs.length > 0 ? (
                                            filteredJobs.map(job => (
                                                <tr key={job.id}>
                                                    <td style={{ fontWeight: 'bold', color: 'var(--slate-500)' }}>#{job.id}</td>
                                                    <td>
                                                        <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>{job.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            <i className="fas fa-link" style={{ fontSize: '0.7rem' }}></i> {job.slug}
                                                        </div>
                                                    </td>
                                                    <td>{job.organization}</td>
                                                    <td>
                                                        <span className={`am-status-badge ${job.job_type.toLowerCase() === 'govt' ? 'review' : 'draft'}`}>
                                                            {job.job_type}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{job.location || 'N/A'}</td>
                                                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(job.application_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                    <td>
                                                        <span className={`am-status-badge ${job.status_display?.toLowerCase() || ((job.is_active || job.isActive || job.status === 'ACTIVE') ? 'published' : 'inactive')}`}>
                                                            {job.status_display || ((job.is_active || job.isActive || job.status === 'ACTIVE') ? 'Published' : 'Inactive')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="am-action-buttons" style={{ justifyContent: 'center' }}>
                                                            <LuxuryTooltip content="Edit">
                                                                <button className="am-action-btn am-btn-edit" onClick={() => navigate(`/cms/jobs/edit/${job.id}`)}>
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                            </LuxuryTooltip>
                                                            {(job.is_active || job.isActive || job.status === 'ACTIVE' || (job.status_display && job.status_display.toUpperCase() === 'ACTIVE')) ? (
                                                                <LuxuryTooltip content="Deactivate">
                                                                    <button className="am-action-btn am-btn-delete" onClick={() => handleAction(job.id, 'deactivate')}>
                                                                        <i className="fas fa-eye-slash"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                            ) : (
                                                                <LuxuryTooltip content="Activate">
                                                                    <button className="am-action-btn am-btn-publish" onClick={() => handleAction(job.id, 'activate')}>
                                                                        <i className="fas fa-eye"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                            )}
                                                            <LuxuryTooltip content="View Public Page">
                                                                <button className="am-action-btn am-btn-edit" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fef3c7' }} onClick={() => window.open(`/jobs/${job.slug}`, '_blank')}>
                                                                    <i className="fas fa-external-link-alt"></i>
                                                                </button>
                                                            </LuxuryTooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="am-empty-state">
                                                    <i className="fas fa-briefcase"></i>
                                                    <h3>No jobs found</h3>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            </div>
        </div>
    </div>
);
};

export default JobsManagement;
