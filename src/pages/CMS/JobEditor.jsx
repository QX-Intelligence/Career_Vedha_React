import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LuxuryTooltip from '../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../services/api';
import { jobsService } from '../../services/jobsService';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../services/notificationService';
import { useSnackbar } from '../../context/SnackbarContext';
import { getRoleInitials } from '../../utils/roleUtils';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import API_CONFIG from '../../config/api.config';
import './JobEditor.css';
import '../../styles/Dashboard.css';

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

const JobEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const isEditMode = !!id;

    // Auth state
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        organization: '',
        job_type: 'PRIVATE',
        location: '',
        application_start_date: '',
        application_end_date: '',
        exam_date: '',
        job_description: '',
        eligibility: '',
        selection_process: '',
        salary: '',
        vacancies: 0,
        qualification: '',
        experience: '',
        apply_url: '',
        department: '',
        status: 1
    });

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
            await rejectRequest(id, "Rejected from job editor");
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

    useEffect(() => {
        if (isEditMode) {
            const fetchJob = async () => {
                try {
                    const job = await jobsService.getAdminJobDetail(id);
                    
                    // Safety checks for date formatting
                    const formatDate = (dateStr) => {
                        if (!dateStr) return '';
                        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                    };

                    setFormData({
                        ...job,
                        application_start_date: formatDate(job.application_start_date),
                        application_end_date: formatDate(job.application_end_date),
                        exam_date: formatDate(job.exam_date),
                        vacancies: job.vacancies || 0
                    });
                } catch (error) {
                    console.error('Error fetching job details:', error);
                    showSnackbar('Failed to load job data', 'error');
                    navigate('/cms/jobs');
                } finally {
                    setLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEditMode, navigate, showSnackbar]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        
        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            
            // Auto-generate slug from title if slug is empty
            if (name === 'title' && !prev.slug) {
                updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final validation
        if (!formData.slug) {
            formData.slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        setSaving(true);
        try {
            if (isEditMode) {
                await jobsService.updateJob(id, formData);
                showSnackbar('Job updated successfully', 'success');
            } else {
                await jobsService.createJob(formData);
                showSnackbar('Job posted successfully', 'success');
            }
            navigate('/cms/jobs');
        } catch (error) {
            const errorMsg = error.response?.data?.error || (isEditMode ? 'Failed to update job' : 'Failed to post job');
            showSnackbar(errorMsg, 'error');
        } finally {
            setSaving(false);
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
        if (item.section === 'cms/jobs') {
            clearGlobalSearch();
        } else if (item.section === 'user-management') {
            navigate('/user-management');
            clearGlobalSearch();
        } else {
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    if (loading) return (
        <div className="cms-loading-overlay">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading editor...</p>
        </div>
    );

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

                <div className="content-container">
                    <form className="job-editor-form" onSubmit={handleSubmit}>
                        <div className="editor-header">
                            <div className="editor-title-area">
                                <h1>{isEditMode ? 'Edit Job Posting' : 'Post New Job'}</h1>
                                <p>Provide accurate details for candidates</p>
                            </div>
                            <div className="editor-actions">
                                <button type="button" className="btn-secondary" onClick={() => navigate('/cms/jobs')}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                    {isEditMode ? 'Update Job' : 'Publish Job'}
                                </button>
                            </div>
                        </div>

                        <div className="editor-grid">
                            <div className="editor-main-panel glass-card">
                                <section className="form-section">
                                    <label>Job Title</label>
                                    <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Software Engineer" required />
                                </section>

                                <div className="form-row">
                                    <section className="form-section">
                                        <label>Organization</label>
                                        <input name="organization" value={formData.organization} onChange={handleChange} placeholder="Company name" required />
                                    </section>
                                    <section className="form-section">
                                        <label>Location</label>
                                        <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote, Hyderabad" required />
                                    </section>
                                </div>

                                <div className="form-row">
                                    <section className="form-section">
                                        <label>Slug (URL Identifier)</label>
                                        <input name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. software-engineer-hyd" required />
                                    </section>
                                    <section className="form-section">
                                        <label>Department</label>
                                        <input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. IT, Education" />
                                    </section>
                                </div>

                                <section className="form-section">
                                    <label>Job Description</label>
                                    <textarea name="job_description" value={formData.job_description} onChange={handleChange} placeholder="Detailed role description" rows="8" required />
                                </section>

                                <section className="form-section">
                                    <label>Eligibility Criteria</label>
                                    <textarea name="eligibility" value={formData.eligibility} onChange={handleChange} placeholder="Who can apply?" rows="4" />
                                </section>

                                <section className="form-section">
                                    <label>Selection Process</label>
                                    <textarea name="selection_process" value={formData.selection_process} onChange={handleChange} placeholder="How are candidates selected?" rows="4" />
                                </section>

                                <div className="form-row">
                                    <section className="form-section">
                                        <label>Qualification</label>
                                        <input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. B.Tech, Any Degree" />
                                    </section>
                                    <section className="form-section">
                                        <label>Experience</label>
                                        <input name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 2-5 years" />
                                    </section>
                                </div>
                            </div>

                            <div className="editor-side-panel glass-card">
                                <section className="form-section">
                                    <label>Job Type</label>
                                    <select name="job_type" value={formData.job_type} onChange={handleChange}>
                                        <option value="PRIVATE">Private Sector</option>
                                        <option value="GOVT">Government / Public Sector</option>
                                    </select>
                                </section>

                                <div className="form-row">
                                    <section className="form-section">
                                        <label>Salary Range</label>
                                        <input name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 5-8 LPA" />
                                    </section>
                                    <section className="form-section">
                                        <label>Vacancies</label>
                                        <input type="number" name="vacancies" value={formData.vacancies} onChange={handleChange} />
                                    </section>
                                </div>

                                <section className="form-section">
                                    <label>Application Link</label>
                                    <input name="apply_url" value={formData.apply_url} onChange={handleChange} placeholder="Official application URL" />
                                </section>

                                <section className="form-section">
                                    <label>Start Date</label>
                                    <input type="date" name="application_start_date" value={formData.application_start_date} onChange={handleChange} />
                                </section>

                                <section className="form-section">
                                    <label>End Date (Deadline)</label>
                                    <input type="date" name="application_end_date" value={formData.application_end_date} onChange={handleChange} required />
                                </section>

                                <section className="form-section">
                                    <label>Exam Date (Optional)</label>
                                    <input type="date" name="exam_date" value={formData.exam_date} onChange={handleChange} />
                                </section>

                                <div className="status-toggle-container">
                                    <span>Set as Active</span>
                                    <label className="switch">
                                        <input type="checkbox" name="status" checked={formData.status === 1} onChange={handleChange} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobEditor;
