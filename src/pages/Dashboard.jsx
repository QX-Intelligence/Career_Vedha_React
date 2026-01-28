import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { getUserContext, setUserContext, subscribeToAuthChanges } from '../services/api';
import '../styles/UserManagement.css';
import '../styles/Dashboard.css';
import useGlobalSearch from '../hooks/useGlobalSearch';
import { getRoleInitials } from '../utils/roleUtils';
import { connectWebSocket, disconnectWebSocket } from '../services/socket';
import { fetchNotifications, fetchAllNotifications, fetchNotificationsByStatus, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../services/notificationService';
import { useSnackbar } from '../context/SnackbarContext';
import API_CONFIG from '../config/api.config';
import CustomSelect from '../components/ui/CustomSelect';
import UserProfileSection from '../components/dashboard/UserProfileSection';
import { newsService } from '../services';
import ArticleManagement from './ArticleManagement';
import LuxuryTooltip from '../components/ui/LuxuryTooltip';
import CMSLayout from '../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../config/accessControl.config.js';

// MEMOIZED SUB-COMPONENTS - Moved outside to prevent re-creation and potential unmounting
const NotificationItem = React.memo(({ notification, onApprove, onReject, onMarkSeen, isArchive, isSuppressed = false, lastSeenAllAt }) => {
    const n = notification;
    // Resilient 'seen' check (handles multiple backend naming conventions + local suppression + global timestamp suppression)
    const ts = n.localDateTime || n.timestamp;
    const isSeenLocally = lastSeenAllAt && ts && new Date(ts) <= new Date(lastSeenAllAt);
    const isSeen = n.seen || n.isSeen || n.read || n.isRead || n.status === 'READ' || isSuppressed || isSeenLocally;

    // Resilient identity mapping
    const requesterIdentity = n.userEmail || n.targetEmail || n.requesterEmail || n.email;
    const displayTitle = n.title || (isArchive ? 'Processed Action' : 'New User Request');

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let relativeTime = '';
        if (diffMins < 1) relativeTime = 'Just now';
        else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
        else if (diffHours < 24) relativeTime = `${diffHours}h ago`;
        else if (diffDays < 7) relativeTime = `${diffDays}d ago`;
        else relativeTime = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

        const fullDateTime = date.toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return { relativeTime, fullDateTime };
    };

    const timeInfo = formatTimestamp(ts);

    return (
        <div key={n.id} className={`approval-card ${isArchive ? 'archived-item' : 'unread'}`}>
            <div className="card-info">
                <div className="user-avatar-small">
                    <i className={isArchive ? "fas fa-check-circle" : "fas fa-user-clock"}></i>
                </div>
                <div className="request-text">
                    <div className="notification-title-row">
                        <strong>{displayTitle}</strong>
                        {isArchive && n.notificationStatus && (
                            <span className={`status-badge-mini ${n.notificationStatus.toLowerCase()}`}>
                                {n.notificationStatus}
                            </span>
                        )}
                        {!isSeen && !isArchive && (
                            <LuxuryTooltip content="New alert">
                                <span className="unseen-dot"></span>
                            </LuxuryTooltip>
                        )}
                    </div>
                    <div className="notification-meta">
                        {isArchive && n.processedBy && (
                            <LuxuryTooltip content="Who actioned this request">
                                <span className="processor-badge">
                                    <i className="fas fa-user-shield"></i> {n.processedBy}
                                </span>
                            </LuxuryTooltip>
                        )}
                        {requesterIdentity && (
                            <LuxuryTooltip content="Identity of the subject">
                                <span className="requester-badge">
                                    <i className="fas fa-user"></i> {requesterIdentity}
                                </span>
                            </LuxuryTooltip>
                        )}
                        {!requesterIdentity && n.message && (
                            <LuxuryTooltip content="System broadcast">
                                <span className="requester-badge system">
                                    <i className="fas fa-robot"></i> System Alert
                                </span>
                            </LuxuryTooltip>
                        )}
                    </div>
                    <p>{n.message}</p>
                </div>
            </div>

            <div className="card-actions">
                {timeInfo && (
                    <LuxuryTooltip content={timeInfo.fullDateTime}>
                        <div className="timestamp-badge">
                            <i className="far fa-clock"></i>
                            <span>{timeInfo.relativeTime}</span>
                        </div>
                    </LuxuryTooltip>
                )}
                {isArchive ? (
                    <div className="archive-date-info">
                        <i className="far fa-calendar-alt"></i>
                        {n.localDateTime ? new Date(n.localDateTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'History'}
                    </div>
                ) : (
                    <>
                        <button className="approve-btn-fancy" onClick={() => onApprove(n.id)}>Approve</button>
                        <button className="reject-btn-fancy" onClick={() => onReject(n.id)}>Reject</button>
                    </>
                )}
            </div>
        </div>
    );
});

const PopoverItem = React.memo(({ notification, onApprove, onReject, onMarkSeen }) => {
    const n = notification;
    return (
        <div key={n.id} className="popover-item">
            <div className="popover-item-text">
                <div className="popover-item-header">
                    <strong>{n.title || 'New Request'}</strong>
                    <LuxuryTooltip content="Mark as read" position="left">
                        <button className="item-seen-btn" onClick={() => onMarkSeen(n.id)}>
                            <i className="fas fa-check"></i>
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

const Dashboard = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    const CustomDatePicker = ({ value, onChange, max }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [currentView, setCurrentView] = useState(new Date(value || new Date()));
        const containerRef = useRef(null);

        const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
        const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

        const handlePrevMonth = () => {
            setCurrentView(new Date(currentView.getFullYear(), currentView.getMonth() - 1, 1));
        };

        const handleNextMonth = () => {
            const next = new Date(currentView.getFullYear(), currentView.getMonth() + 1, 1);
            if (max && next > new Date(max)) return;
            setCurrentView(next);
        };

        const onDateClick = (day) => {
            const selected = new Date(currentView.getFullYear(), currentView.getMonth(), day);
            if (max && selected > new Date(max)) return;
            const yyyy = selected.getFullYear();
            const mm = String(selected.getMonth() + 1).padStart(2, '0');
            const dd = String(selected.getDate()).padStart(2, '0');
            onChange(`${yyyy}-${mm}-${dd}`);
            setIsOpen(false);
        };

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (containerRef.current && !containerRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const renderDays = () => {
            const year = currentView.getFullYear();
            const month = currentView.getMonth();
            const days = [];
            const totalDays = daysInMonth(year, month);
            const startDay = startDayOfMonth(year, month);
            const todayStr = new Date().toISOString().split('T')[0];

            for (let i = 0; i < startDay; i++) {
                days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
            }

            for (let d = 1; d <= totalDays; d++) {
                const dateObj = new Date(year, month, d);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isFuture = max && dateObj > new Date(max);
                const isSelected = value === dateStr;
                const isToday = todayStr === dateStr;

                days.push(
                    <div
                        key={d}
                        className={`calendar-day ${isFuture ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => !isFuture && onDateClick(d)}
                    >
                        {d}
                    </div>
                );
            }
            return days;
        };

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return (
            <div className="custom-datepicker-container" ref={containerRef}>
                <div className={`datepicker-trigger ${value ? 'has-value' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                    <i className="fas fa-filter icon-filter"></i>
                    <span>{value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Filter by Date"}</span>
                    <i className={`fas fa-chevron-down toggle-icon ${isOpen ? 'open' : ''}`}></i>
                </div>

                {isOpen && (
                    <div className="datepicker-dropdown slide-in-top">
                        <div className="datepicker-header">
                            <button className="nav-btn" onClick={handlePrevMonth}><i className="fas fa-chevron-left"></i></button>
                            <div className="header-label">
                                {monthNames[currentView.getMonth()]} {currentView.getFullYear()}
                            </div>
                            <button
                                className={`nav-btn ${max && new Date(currentView.getFullYear(), currentView.getMonth() + 1, 1) > new Date(max) ? 'disabled' : ''}`}
                                onClick={handleNextMonth}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div className="datepicker-weekdays">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="datepicker-grid">
                            {renderDays()}
                        </div>
                        <div className="datepicker-footer">
                            <button className="today-btn-alt" onClick={() => {
                                const now = new Date();
                                const yyyy = now.getFullYear();
                                const mm = String(now.getMonth() + 1).padStart(2, '0');
                                const dd = String(now.getDate()).padStart(2, '0');
                                onChange(`${yyyy}-${mm}-${dd}`);
                                setIsOpen(false);
                            }}>Go to Today</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /* ================= AUTH ================= */
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [homeData, setHomeData] = useState({ hero: [], top_stories: [], breaking: [], latest: { results: [] } });

    /* ================= ERROR HANDLER ================= */
    const handleApiError = (err, fallbackMessage) => {
        console.error(fallbackMessage, err);
        if (err.response?.status === 403) {
            showSnackbar("Access Denied: You don't have permission for this action.", "error");
        } else {
            showSnackbar(err.response?.data?.message || fallbackMessage, "error");
        }
    };

    /* ================= NOTIFICATIONS ================= */
    const [pendingFeed, setPendingFeed] = useState([]);
    const [archiveFeed, setArchiveFeed] = useState([]);

    const [isLoadingPending, setIsLoadingPending] = useState(false);
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);

    const [overallUnseenCount, setOverallUnseenCount] = useState(0);
    const [totalPendingCount, setTotalPendingCount] = useState(0);
    const [totalArchiveCount, setTotalArchiveCount] = useState(0);
    const [hasMorePending, setHasMorePending] = useState(true);
    const [hasMoreArchive, setHasMoreArchive] = useState(true);

    const pendingCursorRef = useRef(null);
    const archiveCursorRef = useRef(null);

    const [loadingMorePending, setLoadingMorePending] = useState(false);
    const [loadingMoreArchive, setLoadingMoreArchive] = useState(false);

    const [pendingFilterDate, setPendingFilterDate] = useState('');
    const [archiveFilterDate, setArchiveFilterDate] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const [suppressedNotificationIds, setSuppressedNotificationIds] = useState(() => {
        try {
            const saved = localStorage.getItem('cv_suppressed_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [lastSeenAllAt, setLastSeenAllAt] = useState(() => {
        return localStorage.getItem('cv_last_seen_all') || null;
    });

    useEffect(() => {
        localStorage.setItem('cv_suppressed_notifs', JSON.stringify(suppressedNotificationIds));
        if (lastSeenAllAt) localStorage.setItem('cv_last_seen_all', lastSeenAllAt);
    }, [suppressedNotificationIds, lastSeenAllAt]);

    const pendingListRef = useRef(null);
    const notificationListRef = useRef(null);
    const pendingSentinelRef = useRef(null);
    const archiveSentinelRef = useRef(null);
    const isFetchingPendingRef = useRef(false);
    const isFetchingArchiveRef = useRef(false);

    const normalizeDateToYYYYMMDD = (d) => {
        if (!d) return "";
        try {
            // ISO format: 2024-05-20T...
            const match = d.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (match) {
                const year = match[1];
                const month = match[2].padStart(2, '0');
                const day = match[3].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            // Alt format: 20-05-2024
            const altMatch = d.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            if (altMatch) {
                const year = altMatch[3];
                const month = altMatch[2].padStart(2, '0');
                const day = altMatch[1].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            // JS Date parse fallback
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }
            return "";
        } catch { return ""; }
    };

    // MEMOIZED FILTERED LISTS (with robust date filtering)
    // Dashboard lists now show TOTAL items (including seen/suppressed) as requested.
    const pendingNotifications = useMemo(() => {
        const filtered = pendingFilterDate
            ? pendingFeed.filter(n => normalizeDateToYYYYMMDD(n.localDateTime || n.timestamp) === pendingFilterDate)
            : pendingFeed;
        // Strictly enforce PENDING status
        return filtered.filter(n => n.notificationStatus === 'PENDING');
    }, [pendingFeed, pendingFilterDate]);

    const archiveNotifications = useMemo(() => {
        const filtered = archiveFilterDate
            ? archiveFeed.filter(n => normalizeDateToYYYYMMDD(n.localDateTime || n.timestamp) === archiveFilterDate)
            : archiveFeed;
        // Enforce non-PENDING status for archive
        return filtered.filter(n => n.notificationStatus !== 'PENDING' && n.notificationStatus !== undefined);
    }, [archiveFeed, archiveFilterDate]);

    const notificationFeed = useMemo(() => {
        return [...pendingFeed, ...archiveFeed];
    }, [pendingFeed, archiveFeed]);

    /* ================= APPROVE / REJECT ================= */
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);

    /* ================= ROLE & PERMISSION ================= */
    const [roleInput, setRoleInput] = useState('');
    const [permissionInput, setPermissionInput] = useState('');

    const [roles, setRoles] = useState([]); // ACTIVE roles
    const [inactiveRoles, setInactiveRoles] = useState([]); // INACTIVE roles
    const [permissions, setPermissions] = useState([]);

    const [assignRole, setAssignRole] = useState('');
    const [assignPermission, setAssignPermission] = useState('');

    /* ================= DELETE MODAL ================= */
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState('');
    const [deleteValue, setDeleteValue] = useState('');

    /* ================= POPOVER ================= */
    const [showPopover, setShowPopover] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSectionState] = useState(searchParams.get('tab') || 'overview');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const setActiveSection = (section) => {
        if (section === 'users') {
            navigate('/user-management');
            return;
        }
        setActiveSectionState(section);
        setSearchParams({ tab: section });
    };

    /* ================= QUIZ FORMS ================= */
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [questionList, setQuestionList] = useState([
        {
            question: '',
            option1: '',
            option2: '',
            option3: '',
            option4: '',
            correctAnswer: ''
        }
    ]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [selectedQuizIds, setSelectedQuizIds] = useState([]);
    const [quizPage, setQuizPage] = useState(0);
    const [quizTotalEntries, setQuizTotalEntries] = useState(0); // For display if needed
    const [quizTotalPages, setQuizTotalPages] = useState(0);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    const fetchQuizQuestions = useCallback(async (page = 0) => {
        try {
            // Using API_CONFIG endpoint we just defined/verified
            // Server-side sort is not supported by current backend, so we sort client-side
            const res = await api.get(`${API_CONFIG.ENDPOINTS.GET_QUESTIONS}?page=${page}&size=10`);
            const data = res.data;
            const content = data.content || [];
            // Sort by ID Ascending to ensure "Serial Number" like ordering
            content.sort((a, b) => a.id - b.id);
            setQuizQuestions(content);
            setQuizTotalPages(data.totalPages || 0);
            setQuizPage(data.number || 0);
            setQuizTotalEntries(data.totalElements || 0);
            setSelectedQuizIds([]); // Reset selection on page change
        } catch (err) {
            console.error("Failed to fetch questions", err);
            handleApiError(err, "Failed to load questions");
        }
    }, []);

    useEffect(() => {
        if (activeSection === 'quizzes') {
            fetchQuizQuestions(quizPage);
        }
    }, [activeSection, quizPage]);
    /* ================= SEARCH ================= */
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchContainerRef = useRef(null);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        // Search definition (Index)
        // 1. Static UI Sections & Sub-headings
        const items = [
            { id: 'overview', title: 'Dashboard Overview', keywords: ['summary', 'stats', 'activity', 'overview', 'dashboard', 'welcome'], section: 'overview' },
            { id: 'approvals', title: 'Recent Activity / Pending Requests', keywords: ['pending', 'approvals', 'requests', 'registration', 'new user', 'recent'], section: 'overview', ref: approvalsRef },
            { id: 'role-ov', title: 'Roles & Permissions Overview', keywords: ['roles', 'permissions', 'access', 'management summary'], section: 'overview', ref: rolesRef },

            // Role Control Sub-sections
            { id: 'rc-main', title: 'Role Control Center', keywords: ['manage definitions', 'role control'], section: 'roles' },
            { id: 'rc-create', title: 'Create New Role', keywords: ['add role', 'new role definition'], section: 'roles' },
            { id: 'rc-inactivate', title: 'Inactivate / Deactivate Role', keywords: ['inactivate', 'deactivate', 'remove role', 'disable'], section: 'roles' },

            // Permissions Sub-sections
            { id: 'perm-main', title: 'Permissions Management', keywords: ['granular rights', 'api access'], section: 'permissions' },
            { id: 'perm-policy', title: 'Policy Definition (New Permission)', keywords: ['create permission', 'new policy', 'define right'], section: 'permissions', ref: permissionsRef },
            { id: 'perm-mapping', title: 'Mapping & Assignment (Roles to Permissions)', keywords: ['mapping', 'assignment', 'attach permission', 'link role'], section: 'permissions', ref: permissionsRef },

            // Other Tabs
            { id: 'quizzes', title: 'Quiz Manager', keywords: ['exam', 'questions', 'bank', 'quiz', 'quizzes', 'publish', 'batch creator'], section: 'quizzes', ref: quizManagerRef },
            { id: 'quiz-new', title: 'Quiz: New Question', keywords: ['new question', 'create exam', 'add quiz'], section: 'quizzes', ref: newQuestionRef },
            { id: 'quiz-test', title: 'Quiz: Test Student View', keywords: ['test view', 'student view', 'preview exam'], section: 'quizzes', ref: testViewRef },
            { id: 'notif-main', title: 'Notifications Center', keywords: ['alerts', 'notifications', 'messages', 'seen', 'unseen', 'bell'], section: 'notifications' },
            { id: 'notif-archive', title: 'Notification Archive', keywords: ['history', 'older', 'past', 'archive', 'records', 'logs'], section: 'notifications', ref: archiveRef },

            // Profile
            { id: 'profile', title: 'My Profile', keywords: ['profile', 'account', 'edit profile', 'my account', 'avatar'], section: 'profile', ref: profileRef },
        ];

        // 2. Dynamic Data: Index Actual Roles
        (roles || []).forEach(r => {
            if (r.toLowerCase().includes(query.toLowerCase())) {
                items.push({
                    id: `role-data-${r}`,
                    title: `Role: ${r}`,
                    keywords: ['role', r.toLowerCase()],
                    section: checkAccess(MODULES.ROLE_CONTROL) ? 'roles' : 'overview'
                });
            }
        });

        // 3. Dynamic Data: Index Actual Permissions
        (permissions || []).forEach(p => {
            if (p.toLowerCase().includes(query.toLowerCase())) {
                items.push({
                    id: `perm-data-${p}`,
                    title: `Permission: ${p}`,
                    keywords: ['permission', p.toLowerCase()],
                    section: checkAccess(MODULES.PERMISSIONS) ? 'permissions' : 'overview',
                    ref: permissionsRef
                });
            }
        });

        // 4. Dynamic Data: Index Notifications Archive
        (archiveNotifications || []).forEach(n => {
            if (n.message.toLowerCase().includes(query.toLowerCase())) {
                items.push({
                    id: `notif-${n.id}`,
                    title: `Archive: ${n.message.substring(0, 45)}...`,
                    keywords: [n.message.toLowerCase(), 'notification'],
                    section: 'notifications',
                    ref: archiveRef
                });
            }
        });

        // 5. Dynamic Data: Index Pending Notifications
        (pendingNotifications || []).forEach(n => {
            if (n.message.toLowerCase().includes(query.toLowerCase())) {
                items.push({
                    id: `notif-${n.id}`,
                    title: `New: ${n.message.substring(0, 45)}...`,
                    keywords: [n.message.toLowerCase(), 'notification'],
                    section: 'notifications',
                    ref: approvalsRef
                });
            }
        });

        const filtered = items.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
        );

        setSearchResults(filtered);
        setShowSearchResults(true);
    };

    const navigateToResult = (item) => {
        setActiveSection(item.section);
        setSearchQuery('');
        setShowSearchResults(false);

        // Wait for rendering then scroll
        setTimeout(() => {
            if (item.ref?.current) {
                const element = item.ref.current;
                const offset = 80; // Header height offset
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Flash animation to highlight the landed spot
                element.classList.add('search-highlight-flash');
                setTimeout(() => element.classList.remove('search-highlight-flash'), 2000);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 150);
    };

    /* ================= REFS ================= */
    const approvalsRef = useRef(null);
    const rolesRef = useRef(null);
    const permissionsRef = useRef(null);
    const quizManagerRef = useRef(null);
    const archiveRef = useRef(null);
    const newQuestionRef = useRef(null);
    const testViewRef = useRef(null);
    const notificationContainerRef = useRef(null);
    const profileRef = useRef(null);

    const scrollToApprovals = () => {
        approvalsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /* ================= CLICK OUTSIDE ================= */
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Notifications popover context
            if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
                setShowPopover(false);
            }
            // Search results context
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const checkAccess = useCallback((module) => {
        return checkAccessGlobal(userRole, module);
    }, [userRole]);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, email, isAuthenticated, firstName, lastName, status } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];

        console.log('Dashboard Auth Check:', { isAuthenticated, role, email });

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            console.warn('Dashboard: Unauthorized access or not authenticated. Redirecting to login.', { role, isAuthenticated });
            return navigate('/admin-login');
        }

        const auth = getUserContext();
        window._AUTH_ = auth;

        setUserRole(role);
        setUserEmail(email);
        setUserStatus(status);

        // Fetch home content from both languages to ensure all pins show in overview
        Promise.all([
            newsService.getHomeContent('te'),
            newsService.getHomeContent('en')
        ]).then(([teData, enData]) => {
            const mergedHero = [...teData.hero, ...enData.hero];
            const mergedTop = [...teData.top_stories, ...enData.top_stories];
            const mergedBreaking = [...teData.breaking, ...enData.breaking];
            const mergedFeatured = [...teData.featured, ...enData.featured];
            const mergedTrending = [...(teData.trending || []), ...(enData.trending || [])];

            const dedup = (list) => {
                const seen = new Set();
                return list.filter(item => {
                    const id = item.article_id || item.pk || item.id;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });
            };

            setHomeData({
                hero: dedup(mergedHero),
                top_stories: dedup(mergedTop),
                breaking: dedup(mergedBreaking),
                featured: dedup(mergedFeatured),
                trending: dedup(mergedTrending),
                latest: teData.latest || { results: [] }
            });
        }).catch(console.error);

        // fetch profile names if not in context
        if (firstName && lastName) {
            setUserFullName(`${firstName} ${lastName}`);
        } else {
            // Fetch profile if names or status are missing
            api.get(API_CONFIG.ENDPOINTS.GET_PROFILE)
                .then(res => {
                    const { firstName: fn, lastName: ln, status: st } = res.data;
                    setUserStatus(st);
                    if (fn && ln) {
                        setUserFullName(`${fn} ${ln}`);
                    } else {
                        setUserFullName(email);
                    }
                })
                .catch(() => setUserFullName(email));
        }

        // Subscribe to real-time updates (e.g. from Profile update)
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

    const [userFullName, setUserFullName] = useState('');
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'users') {
            navigate('/user-management');
            return;
        }
        if (tab && tab !== activeSection) {
            setActiveSectionState(tab);
        }
    }, [searchParams, navigate]);

    /* ================= UNIFIED NOTIFICATION LOADING ================= */
    const fetchUnseenCount = async () => {
        if (!userRole) return;
        try {
            // Strictly follow 20-item load design
            const data = await fetchNotifications(userRole, { size: 20 });
            const rawItems = Array.isArray(data) ? data : (data?.content || []);

            // Filter out items using the existing suppression logic
            const unseen = rawItems.filter(n => {
                const ts = n.localDateTime || n.timestamp;
                const isSeenLocally = lastSeenAllAt && ts && new Date(ts) <= new Date(lastSeenAllAt);
                const isSuppressed = suppressedNotificationIds.includes(n.id);
                return !(n.seen || n.isSeen || n.read || n.isRead || n.status === 'READ' || isSuppressed || isSeenLocally);
            });

            setOverallUnseenCount(unseen.length);

            // Sync total pending count with seen count locally if metadata is missing
            const metadataTotal = extractTotalCount(data, rawItems);
            if (metadataTotal > totalPendingCount) {
                setTotalPendingCount(metadataTotal);
            }
        } catch (err) {
            console.error("Failed to fetch unseen count", err);
        }
    };

    const extractTotalCount = (data, items) => {
        // Deep search for total count keys
        const total = data?.totalElements ||
            data?.total ||
            data?.totalCount ||
            data?.count ||
            data?.page?.totalElements ||
            data?.metadata?.total;

        // If metadata is present, use it. Otherwise, use the length of items we have.
        // If items length equals a common limit like 50, it strongly suggests a cap.
        const currentCount = Array.isArray(items) ? items.length : 0;
        return (total !== undefined && total !== null) ? total : currentCount;
    };

    const loadPendingFeed = useCallback(async (reset = false) => {
        if (!userRole || isFetchingPendingRef.current) return;
        const isFirstLoad = reset || !pendingCursorRef.current;
        if (!isFirstLoad && !hasMorePending) return;

        if (reset) {
            setIsLoadingPending(true);
            pendingCursorRef.current = null;
        } else {
            setLoadingMorePending(true);
        }
        isFetchingPendingRef.current = true;

        try {
            const params = isFirstLoad ? { size: 20 } : {
                size: 20,
                cursorId: pendingCursorRef.current.id,
                cursorTime: pendingCursorRef.current.timestamp
            };
            const data = await fetchNotificationsByStatus('PENDING', userRole, params);
            const rawItems = Array.isArray(data) ? data : (data?.content || []);

            // Advance cursor if we got items
            if (rawItems.length > 0) {
                const lastRaw = rawItems[rawItems.length - 1];
                pendingCursorRef.current = {
                    id: lastRaw.id,
                    timestamp: lastRaw.localDateTime || lastRaw.timestamp || new Date().toISOString()
                };
            }

            const items = rawItems.filter(n => n.notificationStatus === 'PENDING');
            const metadataTotal = data?.totalElements || data?.total || data?.totalCount || data?.count || data?.page?.totalElements || data?.metadata?.total;

            if (reset) {
                setTotalPendingCount(metadataTotal !== undefined ? metadataTotal : items.length);
            } else {
                setTotalPendingCount(prev => metadataTotal !== undefined ? metadataTotal : (prev + items.length));
            }

            setPendingFeed(prev => {
                if (reset) return items;
                const newItems = items.filter(n => !prev.some(p => String(p.id) === String(n.id)));
                if (newItems.length === 0 && items.length > 0) {
                    // Logic to avoid stuck state: if we got items but they were all duplicates, 
                    // it means we might be looping. The cursor advancement above should fix this,
                    // but we'll log it for safety.
                    console.warn("loadPendingFeed: All fetched items were duplicates.");
                }
                return [...prev, ...newItems];
            });

            setHasMorePending(rawItems.length >= 20);
        } catch (err) {
            console.error("Failed to fetch pending notifications", err);
        } finally {
            setIsLoadingPending(false);
            setLoadingMorePending(false);
            isFetchingPendingRef.current = false;
        }
    }, [userRole, hasMorePending]); // Stable callback

    const loadArchiveFeed = useCallback(async (reset = false) => {
        if (!userRole || isFetchingArchiveRef.current) return;
        const isFirstLoad = reset || !archiveCursorRef.current;
        if (!isFirstLoad && !hasMoreArchive) return;

        if (reset) {
            setIsLoadingArchive(true);
            archiveCursorRef.current = null;
        } else {
            setLoadingMoreArchive(true);
        }
        isFetchingArchiveRef.current = true;

        try {
            const params = isFirstLoad ? { size: 20 } : {
                size: 20,
                cursorId: archiveCursorRef.current.id,
                cursorTime: archiveCursorRef.current.timestamp
            };
            const data = await fetchAllNotifications(userRole, params);
            const rawItems = Array.isArray(data) ? data : (data?.content || []);

            // Archive logic: items that are NOT pending
            const items = rawItems.filter(n => n.notificationStatus !== 'PENDING' && n.notificationStatus !== undefined);

            // Extract total
            const metadataTotal = data?.totalElements || data?.total || data?.totalCount || data?.count || data?.page?.totalElements || data?.metadata?.total;

            if (reset) {
                setTotalArchiveCount(metadataTotal !== undefined ? metadataTotal : items.length);
            } else {
                setTotalArchiveCount(prev => metadataTotal !== undefined ? metadataTotal : (prev + items.length));
            }

            // Advance cursor with RAW items to ensure progress
            if (rawItems.length > 0) {
                const lastRaw = rawItems[rawItems.length - 1];
                archiveCursorRef.current = {
                    id: lastRaw.id,
                    timestamp: lastRaw.localDateTime || lastRaw.timestamp || new Date().toISOString()
                };
            }

            setArchiveFeed(prev => {
                if (reset) return items;
                const newItems = items.filter(n => !prev.some(p => String(p.id) === String(n.id)));
                return [...prev, ...newItems];
            });

            setHasMoreArchive(rawItems.length >= 20);
        } catch (err) {
            console.error("Failed to fetch archive notifications", err);
        } finally {
            setIsLoadingArchive(false);
            setLoadingMoreArchive(false);
            isFetchingArchiveRef.current = false;
        }
    }, [userRole, hasMoreArchive]); // Stable callback

    useEffect(() => {
        if (!userRole) return;
        loadPendingFeed(true);
        loadArchiveFeed(true);
        fetchUnseenCount();

        // Background refresh every 30 seconds to keep counts dynamic
        const interval = setInterval(() => {
            fetchUnseenCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [userRole]);

    /* ================= EFFICIENT container-aware SCROLL DETECTION ================= */
    /* ================= EFFICIENT container-aware SCROLL DETECTION ================= */
    useEffect(() => {
        const observerOptions = { rootMargin: '100px', threshold: 0.1 };

        let pObserver = null;
        let aObserver = null;

        const pList = pendingListRef.current;
        const pSentinel = pendingSentinelRef.current;
        // Observers only care if they are permitted to run (hasMore and activeSection)
        if (pList && pSentinel && hasMorePending && activeSection === 'notifications') {
            pObserver = new IntersectionObserver((entries) => {
                if (entries.some(e => e.isIntersecting) && !isFetchingPendingRef.current) {
                    loadPendingFeed(false);
                }
            }, { ...observerOptions, root: pList });
            pObserver.observe(pSentinel);
        }

        const aList = notificationListRef.current;
        const aSentinel = archiveSentinelRef.current;
        const inArchiveView = activeSection === 'notifications' || activeSection === 'overview';
        if (aList && aSentinel && hasMoreArchive && inArchiveView) {
            aObserver = new IntersectionObserver((entries) => {
                if (entries.some(e => e.isIntersecting) && !isFetchingArchiveRef.current) {
                    loadArchiveFeed(false);
                }
            }, { ...observerOptions, root: aList });
            aObserver.observe(aSentinel);
        }

        return () => {
            if (pObserver) pObserver.disconnect();
            if (aObserver) aObserver.disconnect();
        };
    }, [hasMorePending, hasMoreArchive, activeSection, loadPendingFeed, loadArchiveFeed]);

    /* ================= FETCH ROLES & PERMISSIONS ================= */
    const loadRolesAndPermissions = async () => {
        // Only load if user has role control or permissions access
        if (!userRole || (!checkAccess(MODULES.ROLE_CONTROL) && !checkAccess(MODULES.PERMISSIONS))) {
            console.log('Skipping loadRolesAndPermissions - no access or userRole not set:', userRole);
            return;
        }

        console.log('Loading roles and permissions for role:', userRole);

        // Fetch active roles
        try {
            const rolesRes = await api.get('/get-active-roles');
            console.log('Active roles response:', rolesRes.data);
            setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        } catch (err) {
            console.error("Failed to load active roles", err);
            setRoles([]);
        }

        // Fetch inactive roles (backend typo: incative)
        try {
            const inactiveRes = await api.get('/get-incative-roles');
            console.log('Inactive roles response:', inactiveRes.data);
            setInactiveRoles(Array.isArray(inactiveRes.data) ? inactiveRes.data : []);
        } catch (err) {
            console.error("Failed to load inactive roles", err);
            setInactiveRoles([]);
        }

        // Fetch permissions
        try {
            const permsRes = await api.get('/permission-names');
            console.log('Permissions response:', permsRes.data);
            setPermissions(Array.isArray(permsRes.data) ? permsRes.data : []);
        } catch (err) {
            console.error("Failed to load permissions", err);
            if (err.response?.status === 403) {
                console.warn('⚠️ ADMIN role does not have backend permission to access /permission-names endpoint');
            }
            setPermissions([]);
        }
    };

    useEffect(() => {
        loadRolesAndPermissions();
    }, [userRole]);

    /* ================= WEBSOCKET ================= */
    useEffect(() => {
        if (!userRole) return;

        connectWebSocket(userRole, (n) => {
            if (n.notificationStatus === 'PENDING') {
                setPendingFeed(prev => {
                    if (prev.some(x => x.id === n.id)) return prev;
                    if (!n.seen) setOverallUnseenCount(c => c + 1);
                    setTotalPendingCount(c => c + 1);
                    return [n, ...prev];
                });
            } else {
                setArchiveFeed(prev => {
                    if (prev.some(x => x.id === n.id)) return prev;
                    setTotalArchiveCount(c => c + 1);
                    return [n, ...prev];
                });
            }
        });

        return () => disconnectWebSocket();
    }, [userRole]);

    /* ================= APPROVE ================= */
    const handleApprove = async (id) => {
        try {
            await approveRequest(id);
            // Move from pending to archive
            const item = pendingFeed.find(n => n.id === id);
            if (item) {
                if (!item.seen) setOverallUnseenCount(c => Math.max(0, c - 1));
                setPendingFeed(prev => prev.filter(n => n.id !== id));
                setTotalPendingCount(c => Math.max(0, c - 1));
                setTotalArchiveCount(c => c + 1);
                // Tag with processedBy to avoid overwriting the original userEmail (requester)
                setArchiveFeed(prev => [{
                    ...item,
                    notificationStatus: 'APPROVED',
                    seen: true,
                    processedBy: userEmail, // Current admin identity
                    localDateTime: new Date().toISOString()
                }, ...prev]);
            }
            showSnackbar('Request approved successfully', 'success');
            fetchUnseenCount(); // Refresh count after action
        } catch (error) {
            handleApiError(error, 'Approval failed');
        }
    };

    /* ================= REJECT ================= */
    const openRejectModal = (id) => {
        setSelectedNotificationId(id);
        setRejectReason('');
        setRejectModal(true);
    };

    const confirmReject = async () => {
        try {
            await rejectRequest(selectedNotificationId, rejectReason || 'Rejected by admin');
            const item = pendingFeed.find(n => n.id === selectedNotificationId);
            if (item) {
                if (!item.seen) setOverallUnseenCount(c => Math.max(0, c - 1));
                setPendingFeed(prev => prev.filter(n => n.id !== selectedNotificationId));
                setTotalPendingCount(c => Math.max(0, c - 1));
                setTotalArchiveCount(c => c + 1);
                setArchiveFeed(prev => [{
                    ...item,
                    notificationStatus: 'REJECTED',
                    seen: true,
                    processedBy: userEmail,
                    localDateTime: new Date().toISOString()
                }, ...prev]);
            }
            setRejectModal(false);
            showSnackbar('Request rejected', 'info');
            fetchUnseenCount(); // Refresh count after action
        } catch (error) {
            handleApiError(error, 'Rejection failed');
        }
    };

    /* ================= MARK AS SEEN ================= */
    const handleMarkAsSeen = async (id) => {
        try {
            await markAsSeen(id);
            setPendingFeed(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
            // Also update in archive if it's there (rare but possible if user sees it from bell while in archive tab)
            setArchiveFeed(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
            setOverallUnseenCount(c => Math.max(0, c - 1));
            setSuppressedNotificationIds(prev => [...new Set([...prev, id])]);
        } catch (err) {
            console.error("Failed to mark as seen", err);
        }
    };

    const handleMarkAllSeen = async () => {
        try {
            await markAllAsSeen(userRole);
            const now = new Date().toISOString();
            setPendingFeed(prev => prev.map(n => ({ ...n, seen: true })));
            setArchiveFeed(prev => prev.map(n => ({ ...n, seen: true })));
            setOverallUnseenCount(0);
            setLastSeenAllAt(now);
            setSuppressedNotificationIds(prev => [...new Set([...prev, ...pendingFeed.map(n => n.id)])]);
            showSnackbar("All notifications marked as seen", "success");
        } catch (err) {
            handleApiError(err, "Failed to clear notifications");
        }
    };

    /* ================= CREATE ================= */
    const createRole = async () => {
        if (!roleInput) return showSnackbar("Please enter a role name", "warning");
        try {
            await api.post('/create-role', { roleName: roleInput });
            setRoleInput('');
            loadRolesAndPermissions();
            showSnackbar('Role created successfully', 'success');
        } catch (e) { handleApiError(e, 'Failed to create role'); }
    };

    const createPermission = async () => {
        if (!permissionInput) return showSnackbar("Please enter a permission name", "warning");
        try {
            await api.post('/create-permission', { permissionName: permissionInput });
            setPermissionInput('');
            loadRolesAndPermissions();
            showSnackbar('Permission created successfully', 'success');
        } catch (e) { handleApiError(e, 'Failed to create permission'); }
    };

    /* ================= ASSIGN / REMOVE ================= */
    const addPermissionToRole = async () => {
        if (!assignRole || !assignPermission) return showSnackbar("Please select both role and permission", "warning");
        try {
            await api.post('/add-permission',
                { roleName: assignRole, permissionName: assignPermission }
            );
            showSnackbar('Permission added successfully', 'success');
        } catch (e) { handleApiError(e, 'Failed to add permission'); }
    };

    const removePermissionFromRole = () => {
        if (!assignRole || !assignPermission) return showSnackbar("Select both role and permission", "warning");
        api.post('/remove-permission', { roleName: assignRole, permissionName: assignPermission })
            .then(res => {
                showSnackbar(res.data.message || "Permission removed", "success");
                loadRolesAndPermissions();
            })
            .catch(err => handleApiError(err, "Action failed"));
    };

    /* ================= QUIZ MANAGEMENT ================= */
    const handleQuestionChange = (index, e) => {
        const { name, value } = e.target;
        setQuestionList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], [name]: value };
            return newList;
        });
    };

    const addQuestionField = () => {
        if (isEditingQuestion) return; // Prevent adding more in edit mode
        setQuestionList(prev => [
            ...prev,
            { question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '' }
        ]);
        showSnackbar("New question form added", "info");
    };

    const removeQuestionField = (index) => {
        if (questionList.length <= 1) return;
        setQuestionList(prev => prev.filter((_, i) => i !== index));
    };

    const submitQuestion = async () => {
        // Basic validation
        for (let i = 0; i < questionList.length; i++) {
            const q = questionList[i];
            if (!q.question || !q.option1 || !q.option2 || !q.option3 || !q.option4 || !q.correctAnswer) {
                return showSnackbar(`Please fill all fields for question #${i + 1}`, "warning");
            }
        }

        try {
            if (isEditingQuestion && editingQuestionId) {
                // Edit Mode - single question
                const q = questionList[0];
                await api.put(`${API_CONFIG.ENDPOINTS.EDIT_QUESTION}/${editingQuestionId}`, q);
                showSnackbar("Question updated successfully", "success");
            } else {
                // Create Mode - BULK submission with single API call
                await api.post(API_CONFIG.ENDPOINTS.POST_QUESTION, questionList);
                showSnackbar(`Successfully published ${questionList.length} question(s)!`, "success");
            }

            setShowQuestionModal(false);
            setQuestionList([{ question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '' }]);
            setIsEditingQuestion(false);
            setEditingQuestionId(null);
            // Refresh list if we are on the quiz tab
            if (activeSection === 'quizzes') fetchQuizQuestions(quizPage);
        } catch (err) {
            handleApiError(err, isEditingQuestion ? "Failed to update question" : "Failed to publish questions");
        }
    };

    const handleEditQuestion = (q) => {
        setIsEditingQuestion(true);
        setEditingQuestionId(q.id);
        setQuestionList([{
            question: q.question,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAnswer: q.correctAnswer || ''
        }]);
        setShowQuestionModal(true);
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            await api.delete(`${API_CONFIG.ENDPOINTS.DELETE_QUESTION}/${id}`);
            showSnackbar("Question deleted successfully", "success");
            fetchQuizQuestions(quizPage);
        } catch (err) {
            handleApiError(err, "Failed to delete question");
        }
    };

    const handleToggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedQuizIds(quizQuestions.map(q => q.id));
        } else {
            setSelectedQuizIds([]);
        }
    };

    const handleToggleSelectOne = (id) => {
        setSelectedQuizIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedQuizIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedQuizIds.length} questions?`)) return;

        try {
            // Sequential delete to not overwhelm server/browser
            // A bulk endpoint would be better, but we work with what we have
            let successCount = 0;
            for (const id of selectedQuizIds) {
                try {
                    await api.delete(`${API_CONFIG.ENDPOINTS.DELETE_QUESTION}/${id}`);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to delete question ${id}`, e);
                }
            }
            showSnackbar(`Deleted ${successCount} questions successfully`, "success");
            fetchQuizQuestions(quizPage);
        } catch (err) {
            handleApiError(err, "Bulk delete process failed");
        }
    };

    const toggleCorrectOption = (index, key) => {
        setQuestionList(prev => {
            const newList = [...prev];
            let current = newList[index].correctAnswer || "";
            let next;
            if (current.includes(key)) {
                next = current.replace(key, "");
            } else {
                next = current + key;
            }
            next = next.split('').sort().join('');
            newList[index] = { ...newList[index], correctAnswer: next };
            return newList;
        });
    };

    /* ================= ACTIVATE ================= */
    const activateRole = async (roleName) => {
        if (!roleName) return showSnackbar("Please select a role to activate", "warning");
        try {
            // Using POST /active-role as per backend controller
            await api.post('/active-role', { roleName });
            setRoleInput(''); // Clear input if used
            loadRolesAndPermissions();
            showSnackbar('Role activatated successfully', 'success');
        } catch (e) {
            handleApiError(e, 'Failed to activate role');
        }
    };

    /* ================= ACTION HANDLER (Delete/Activate) ================= */
    const openDeleteModal = (type, value) => {
        if (!value) return;
        setDeleteType(type);
        setDeleteValue(value);
        setDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            if (deleteType === 'role') {
                await api.delete('/inactive-role', {
                    data: { roleName: deleteValue }
                });
                showSnackbar('Role inactivated successfully', 'success');
            } else if (deleteType === 'activate_role') {
                await api.post('/active-role', { roleName: deleteValue });
                showSnackbar('Role reactivated successfully', 'success');
            } else {
                await api.delete('/delete-permission', {
                    data: { permissionName: deleteValue }
                });
                showSnackbar('Permission deleted successfully', 'success');
            }
            setDeleteModal(false);
            loadRolesAndPermissions();
        } catch (e) {
            handleApiError(e, 'Action failed');
        }
    };

    /* ================= LOGOUT ================= */
    const handleLogout = async () => {
        try {
            await api.post(API_CONFIG.ENDPOINTS.LOGOUT);
        } catch (err) {
            console.error("Backend logout failed", err);
        } finally {
            setUserContext(null, null, null);
            disconnectWebSocket();
            navigate('/admin-login');
        }
    };

    const notificationPopover = showPopover && (
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
                            onApprove={(id) => { handleApprove(id); setShowPopover(false); }}
                            onReject={(id) => { openRejectModal(id); setShowPopover(false); }}
                            onMarkSeen={handleMarkAsSeen}
                        />
                    ))
                )}
            </div>
            <div className="popover-footer" onClick={() => { setShowPopover(false); setActiveSection('notifications'); }}>
                View All History
            </div>
        </div>
    );

    const sidebarProps = {
        activeSection,
        setActiveSection,
        userRole,
        userEmail,
        userFullName,
        userStatus,
        checkAccess,
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        searchQuery,
        handleSearch,
        showSearchResults,
        searchResults,
        navigateToResult,
        setShowSearchResults,
        overallUnseenCount,
        setShowPopover,
        userFullName,
        userEmail,
        userRole,
        notificationPopover,
        handleMarkAllSeen,
        userStatus
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>


                    {/* Render Overview Section */}
                    {activeSection === 'overview' && (
                        <div className="section-fade-in">
                            <div className="page-header-row">
                                <div>
                                    <h1>Overview</h1>
                                    <p className="subtitle">Welcome back! Here is what's happening today.</p>
                                </div>
                                <div className="date-display">
                                    <i className="far fa-calendar-alt"></i>
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            {/* Summary Stats Card Row */}
                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-icon yellow"><i className="fas fa-user-clock"></i></div>
                                    <div className="stat-data">
                                        <span className="stat-value">{totalPendingCount}</span>
                                        <span className="stat-label">Pending Req</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon blue"><i className="fas fa-user-shield"></i></div>
                                    <div className="stat-data">
                                        <span className="stat-value">{roles.length}</span>
                                        <span className="stat-label">Total Roles</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green"><i className="fas fa-key"></i></div>
                                    <div className="stat-data">
                                        <span className="stat-value">{permissions.length}</span>
                                        <span className="stat-label">Permissions</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Approvals Section */}
                            <div className="dashboard-section" ref={approvalsRef}>
                                <div className="section-title-row">
                                    <h3><i className="fas fa-clock-rotate-left"></i> Recent Activity</h3>
                                    <span className="count-pill">{totalPendingCount} pending</span>
                                </div>

                                <div className="approvals-grid">
                                    {pendingNotifications.length === 0 ? (
                                        <div className="empty-state-card">
                                            <i className="fas fa-check-double"></i>
                                            <p>All caught up! No pending approval requests.</p>
                                        </div>
                                    ) : (
                                        pendingNotifications.slice(0, 5).map(n => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onApprove={handleApprove}
                                                onReject={openRejectModal}
                                                onMarkSeen={handleMarkAsSeen}
                                                isArchive={false}
                                                lastSeenAllAt={lastSeenAllAt}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Featured Content Quick View */}
                            <div className="dashboard-section">
                                <div className="section-title-row">
                                    <h3><i className="fas fa-thumbtack"></i> Live Featured Content</h3>
                                    <button className="m-btn-text" onClick={() => setActiveSection('articles')}>Manage All</button>
                                </div>
                                <div className="management-grid-refined" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    <div className="m-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                        <div className="m-card-title">Featured Stories ({homeData.featured?.length || 0})</div>
                                        <div className="m-card-body" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {homeData.featured?.map(h => (
                                                <div key={h.id} style={{ fontSize: '0.85rem', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            background: '#fee2e2',
                                                            color: '#b91c1c',
                                                            padding: '1px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: '700'
                                                        }}>{h.feature_type || 'FEATURED'}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{h.section}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <i className="fas fa-star" style={{ color: '#f59e0b', marginTop: '3px' }}></i>
                                                        <span style={{ fontWeight: '500' }}>{h.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!homeData.featured || homeData.featured.length === 0) && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No featured stories pinned.</p>}
                                        </div>
                                    </div>
                                    <div className="m-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                        <div className="m-card-title">Trending Now ({homeData.trending?.length || 0})</div>
                                        <div className="m-card-body" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {homeData.trending?.map(t => (
                                                <div key={t.id} style={{ fontSize: '0.85rem', padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                                                    <i className="fas fa-fire" style={{ color: '#f59e0b', marginTop: '3px' }}></i>
                                                    <div>
                                                        <div style={{ fontWeight: '500' }}>{t.title || t.summary}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}><i className="far fa-eye"></i> {t.views_count} views</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!homeData.trending || homeData.trending.length === 0) && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No trending news active.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Role & Permission Management - Restored to Overview for consistency */}
                            {checkAccess(MODULES.ROLE_CONTROL) && (
                                <div className="dashboard-section" ref={rolesRef}>
                                    <div className="section-title-row">
                                        <h3><i className="fas fa-users-gear"></i> Roles & Permissions</h3>
                                    </div>

                                    <div className="management-grid-refined">
                                        {/* Create Card */}
                                        <div className="m-card">
                                            <div className="m-card-title">Create New</div>
                                            <div className="m-card-body">
                                                <div className="m-input-group">
                                                    <label>Role Name</label>
                                                    <div className="input-with-icon">
                                                        <i className="fas fa-user-shield"></i>
                                                        <input placeholder="e.g. EDITOR" value={roleInput} onChange={e => setRoleInput(e.target.value)} />
                                                    </div>
                                                    <button onClick={createRole} className="m-btn-primary">Create Role</button>
                                                </div>
                                                <div className="m-divider">OR</div>
                                                <div className="m-input-group">
                                                    <label>Permission Name</label>
                                                    <div className="input-with-icon">
                                                        <i className="fas fa-key"></i>
                                                        <input placeholder="e.g. DELETE_POST" value={permissionInput} onChange={e => setPermissionInput(e.target.value)} />
                                                    </div>
                                                    <button onClick={createPermission} className="m-btn-primary">Create Permission</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assign Card */}
                                        <div className="m-card">
                                            <div className="m-card-title">Assign Permissions</div>
                                            <div className="m-card-body">
                                                <div className="m-input-group">
                                                    <CustomSelect
                                                        label="Select Role"
                                                        value={assignRole}
                                                        options={Array.isArray(roles) ? roles : []}
                                                        onChange={setAssignRole}
                                                        placeholder="Choose a role..."
                                                    />
                                                </div>
                                                <div className="m-input-group">
                                                    <CustomSelect
                                                        label="Select Permission"
                                                        value={assignPermission}
                                                        options={Array.isArray(permissions) ? permissions : []}
                                                        onChange={setAssignPermission}
                                                        placeholder="Choose a permission..."
                                                    />
                                                </div>
                                                <div className="m-btn-row">
                                                    <button onClick={addPermissionToRole} className="m-btn-success">
                                                        <i className="fas fa-plus"></i> Add
                                                    </button>
                                                    <button onClick={removePermissionFromRole} className="m-btn-danger-outline">
                                                        <i className="fas fa-minus"></i> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Danger Zone Card */}
                                        <div className="m-card danger-zone">
                                            <div className="m-card-title">Manage Existing</div>
                                            <div className="m-card-body">
                                                <div className="m-input-group">
                                                    <CustomSelect
                                                        label="Inactivate Role"
                                                        value=""
                                                        options={Array.isArray(roles) ? roles : []}
                                                        onChange={(val) => openDeleteModal('role', val)}
                                                        placeholder="Select role to inactivate..."
                                                        icon="fas fa-ban"
                                                    />
                                                </div>
                                                <div className="m-input-group">
                                                    <CustomSelect
                                                        label="Delete Permission"
                                                        value=""
                                                        options={Array.isArray(permissions) ? permissions : []}
                                                        onChange={(val) => openDeleteModal('permission', val)}
                                                        placeholder="Select permission to delete..."
                                                        icon="fas fa-trash-alt"
                                                    />
                                                </div>
                                                <p className="danger-hint">Warning: Actions here are permanent or affect system access.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Render Roles Management Section */}
                    {activeSection === 'roles' && checkAccess(MODULES.ROLE_CONTROL) && (
                        <div className="section-fade-in">
                            <div className="page-header-row">
                                <div>
                                    <h1>Role Control</h1>
                                    <p className="subtitle">Manage system access levels and role definitions.</p>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <div className="management-grid-refined">
                                    <div className="m-card">
                                        <div className="m-card-title">Create New Role</div>
                                        <div className="m-card-body">
                                            <div className="m-input-group">
                                                <label>Role Name</label>
                                                <div className="input-with-icon">
                                                    <i className="fas fa-user-shield"></i>
                                                    <input placeholder="e.g. EDITOR" value={roleInput} onChange={e => setRoleInput(e.target.value)} />
                                                </div>
                                                <button onClick={createRole} className="m-btn-primary">Create Role</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="m-card danger-zone">
                                        <div className="m-card-title">Inactivate Role</div>
                                        <div className="m-card-body">
                                            <div className="m-input-group">
                                                <CustomSelect
                                                    label="Inactivate Role"
                                                    value=""
                                                    options={Array.isArray(roles) ? roles : []}
                                                    onChange={(val) => openDeleteModal('role', val)}
                                                    placeholder="Select role to inactivate..."
                                                    icon="fas fa-ban"
                                                />
                                            </div>
                                            <p className="danger-hint">Inactivating a role prevents new users from signing up with it.</p>
                                        </div>
                                    </div>

                                    <div className="m-card success-zone">
                                        <div className="m-card-title">Reactivate Role</div>
                                        <div className="m-card-body">
                                            <div className="m-input-group">
                                                <CustomSelect
                                                    label="Select Role"
                                                    value=""
                                                    options={Array.isArray(inactiveRoles) ? inactiveRoles : []}
                                                    onChange={(val) => openDeleteModal('activate_role', val)}
                                                    placeholder="Select role to reactivate..."
                                                    icon="fas fa-redo"
                                                />
                                                <p className="hint-text">Reactivating allows users to sign up with this role again.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render Permissions Section */}
                    {activeSection === 'permissions' && checkAccess(MODULES.PERMISSIONS) && (
                        <div className="section-fade-in" ref={permissionsRef}>
                            <div className="page-header-row">
                                <div>
                                    <h1>Permissions</h1>
                                    <p className="subtitle">Configure granular action rights and API access.</p>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <div className="management-grid-refined">
                                    <div className="m-card">
                                        <div className="m-card-title">Policy Definition</div>
                                        <div className="m-card-body">
                                            <div className="m-input-group">
                                                <label>New Permission</label>
                                                <div className="input-with-icon">
                                                    <i className="fas fa-key"></i>
                                                    <input placeholder="e.g. DELETE_POST" value={permissionInput} onChange={e => setPermissionInput(e.target.value)} />
                                                </div>
                                                <button onClick={createPermission} className="m-btn-primary">Create Permission</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="m-card">
                                        <div className="m-card-title">Mapping & Assignment</div>
                                        <div className="m-card-body">
                                            <div className="m-input-group">
                                                <CustomSelect
                                                    label="Role"
                                                    value={assignRole}
                                                    options={Array.isArray(roles) ? roles : []}
                                                    onChange={setAssignRole}
                                                    placeholder="Choose a role..."
                                                />
                                            </div>
                                            <div className="m-input-group">
                                                <CustomSelect
                                                    label="Permission"
                                                    value={assignPermission}
                                                    options={Array.isArray(permissions) ? permissions : []}
                                                    onChange={setAssignPermission}
                                                    placeholder="Choose a permission..."
                                                />
                                            </div>
                                            <div className="m-btn-row">
                                                <button onClick={addPermissionToRole} className="m-btn-success">Add</button>
                                                <button onClick={removePermissionFromRole} className="m-btn-danger-outline">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render Quizzes Section */}
                    {activeSection === 'quizzes' && (
                        <div className="section-fade-in" ref={quizManagerRef}>
                            <div className="page-header-row">
                                <div>
                                    <h1>Quiz Manager</h1>
                                    <p className="subtitle">Manage questions, view bank analytics and publish exams.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="m-btn-primary"
                                        style={{ width: 'auto', padding: '0 1.5rem', height: '45px', background: 'var(--slate-600)' }}
                                        onClick={() => navigate('/exam', { state: { fromAdmin: true } })}
                                    >
                                        <i className="fas fa-eye"></i> Student View
                                    </button>
                                    <button
                                        ref={newQuestionRef}
                                        className="m-btn-primary"
                                        style={{ width: 'auto', padding: '0 1.5rem', height: '45px' }}
                                        onClick={() => {
                                            setIsEditingQuestion(false);
                                            setEditingQuestionId(null);
                                            setQuestionList([{ question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '' }]);
                                            setShowQuestionModal(true);
                                        }}
                                    >
                                        <i className="fas fa-plus"></i> New Question
                                    </button>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                {quizQuestions.length === 0 ? (
                                    <div className="empty-state-card" style={{ background: 'white', border: '1px solid var(--slate-200)' }}>
                                        <i className="fas fa-vial" style={{ color: 'var(--slate-300)' }}></i>
                                        <h3>No Questions Found</h3>
                                        <p>Your question bank is empty. Add your first question to get started.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        {selectedQuizIds.length > 0 && (
                                            <div style={{ padding: '0.75rem 1.5rem', background: '#fff1f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.9rem' }}>
                                                    {selectedQuizIds.length} selected
                                                </span>
                                                <button
                                                    onClick={handleBulkDelete}
                                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                                >
                                                    <i className="fas fa-trash-alt" style={{ marginRight: '6px' }}></i> Delete Selected
                                                </button>
                                            </div>
                                        )}
                                        <table className="q-table-refined">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={quizQuestions.length > 0 && selectedQuizIds.length === quizQuestions.length}
                                                            onChange={handleToggleSelectAll}
                                                        />
                                                    </th>
                                                    <th>ID</th>
                                                    <th>Question</th>
                                                    <th>Options</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quizQuestions.map(q => (
                                                    <tr key={q.id} className={selectedQuizIds.includes(q.id) ? 'row-selected' : ''} style={selectedQuizIds.includes(q.id) ? { background: '#fef2f2' } : {}}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedQuizIds.includes(q.id)}
                                                                onChange={() => handleToggleSelectOne(q.id)}
                                                            />
                                                        </td>
                                                        <td>#{q.id}</td>
                                                        <td>
                                                            <LuxuryTooltip content={q.question}>
                                                                <div className="q-text-cell">{q.question}</div>
                                                            </LuxuryTooltip>
                                                        </td>
                                                        <td>
                                                            <div className="q-opts-cell">
                                                                {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                                                                    const optVal = q[`option${idx + 1}`];
                                                                    const isCorrect = q.correctAnswer && q.correctAnswer.includes(optKey);
                                                                    return (
                                                                        <span
                                                                            key={optKey}
                                                                            className="opt-pill"
                                                                            style={isCorrect ? {
                                                                                background: '#dcfce7',
                                                                                color: '#166534',
                                                                                border: '1px solid #bbf7d0',
                                                                                fontWeight: '700'
                                                                            } : {}}
                                                                        >
                                                                            {optKey}: {optVal} {isCorrect && <i className="fas fa-check-circle" style={{ marginLeft: '4px' }}></i>}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <LuxuryTooltip content="Edit">
                                                                    <button className="btn-icon-edit" onClick={() => handleEditQuestion(q)}>
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                                <LuxuryTooltip content="Delete">
                                                                    <button className="btn-icon-delete" onClick={() => handleDeleteQuestion(q.id)}>
                                                                        <i className="fas fa-trash-alt"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div className="pagination-controls">
                                            <button
                                                disabled={quizPage === 0}
                                                onClick={() => fetchQuizQuestions(quizPage - 1)}
                                                className="p-btn"
                                            >
                                                <i className="fas fa-chevron-left"></i> Prev
                                            </button>
                                            <span className="p-info">Page {quizPage + 1} of {quizTotalPages}</span>
                                            <button
                                                disabled={quizPage >= quizTotalPages - 1}
                                                onClick={() => fetchQuizQuestions(quizPage + 1)}
                                                className="p-btn"
                                            >
                                                Next <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Render Full Notifications Section */}
                    {activeSection === 'notifications' && (
                        <div className="section-fade-in">
                            <div className="page-header-row">
                                <div>
                                    <h1>Notifications</h1>
                                    <p className="subtitle">Complete history of system alerts and user requests.</p>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <div className="section-title-row">
                                    <div className="title-stack">
                                        <div className="title-with-count">
                                            <h3><i className="fas fa-envelope-open-text"></i> Pending Requests</h3>
                                            <span className="count-pill">{pendingFilterDate ? pendingNotifications.length : totalPendingCount}</span>
                                        </div>
                                        <p className="subtitle-mini">Active approval queue</p>
                                    </div>
                                    <div className="notification-controls-wrapper">
                                        <CustomDatePicker
                                            value={pendingFilterDate}
                                            onChange={setPendingFilterDate}
                                            max={today}
                                        />
                                        {pendingFilterDate && (
                                            <LuxuryTooltip content="Clear filter">
                                                <button className="clear-chip" onClick={() => setPendingFilterDate('')}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </LuxuryTooltip>
                                        )}
                                    </div>
                                </div>

                                <div className="approvals-grid" ref={pendingListRef} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {pendingFeed.length === 0 && !isLoadingPending && !loadingMorePending ? (
                                        <div className="empty-state-card" style={{ padding: '2rem' }}>
                                            <i className="fas fa-check-circle" style={{ color: 'var(--success-green)' }}></i>
                                            <p>All active requests have been reviewed.</p>
                                        </div>
                                    ) : (
                                        pendingNotifications.map(n => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onApprove={handleApprove}
                                                onReject={openRejectModal}
                                                onMarkSeen={handleMarkAsSeen}
                                                isArchive={false}
                                                isSuppressed={suppressedNotificationIds.includes(n.id) || (lastSeenAllAt && n.timestamp && new Date(n.timestamp) <= new Date(lastSeenAllAt))}
                                            />
                                        ))
                                    )}

                                    {/* Loading Indicators */}
                                    {isLoadingPending && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Opening pending list...</p>
                                        </div>
                                    )}

                                    {loadingMorePending && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Searching for more...</p>
                                        </div>
                                    )}

                                    {!hasMorePending && pendingFeed.length > 0 && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-check-circle" style={{ color: 'var(--success-green)', fontSize: '1.5rem' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>End of requests</p>
                                        </div>
                                    )}

                                    {/* Scroll Sentinel */}
                                    {hasMorePending && (
                                        <div ref={pendingSentinelRef} style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {!loadingMorePending && <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Scroll for more requests</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-section" style={{ marginTop: '3rem' }} ref={archiveRef}>
                                <div className="section-title-row">
                                    <div className="title-stack">
                                        <div className="title-with-count">
                                            <h3><i className="fas fa-box-archive"></i> Notification Archive</h3>
                                        </div>
                                        <p className="subtitle-mini">Historical records</p>
                                    </div>
                                    <div className="notification-controls-wrapper">
                                        <CustomDatePicker
                                            value={archiveFilterDate}
                                            onChange={setArchiveFilterDate}
                                            max={today}
                                        />
                                        {archiveFilterDate && (
                                            <LuxuryTooltip content="Clear filter">
                                                <button className="clear-chip" onClick={() => setArchiveFilterDate('')}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </LuxuryTooltip>
                                        )}
                                    </div>
                                </div>

                                <div className="approvals-grid" ref={notificationListRef} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {archiveFeed.length === 0 && !isLoadingArchive && !loadingMoreArchive ? (
                                        <div className="empty-state-card" style={{ background: '#f1f5f9' }}>
                                            <p>No older notifications in the archive.</p>
                                        </div>
                                    ) : (
                                        archiveNotifications.map(n => (
                                            <NotificationItem
                                                key={n.id}
                                                notification={n}
                                                onApprove={handleApprove}
                                                onReject={openRejectModal}
                                                onMarkSeen={handleMarkAsSeen}
                                                isArchive={true}
                                                isSuppressed={suppressedNotificationIds.includes(n.id)}
                                            />
                                        )))}

                                    {/* Archive Loading Indicators */}
                                    {isLoadingArchive && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Opening archive...</p>
                                        </div>
                                    )}

                                    {loadingMoreArchive && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Searching history...</p>
                                        </div>
                                    )}

                                    {!hasMoreArchive && archiveFeed.length > 0 && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-check-circle" style={{ color: 'var(--success-green)', fontSize: '1.5rem' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Archive complete</p>
                                        </div>
                                    )}

                                    {/* Scroll Sentinel */}
                                    {hasMoreArchive && (
                                        <div ref={archiveSentinelRef} style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {!loadingMoreArchive && <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Scroll for older history</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render User Profile Section */}
                    {activeSection === 'profile' && (
                        <div ref={profileRef} className="dashboard-section animate-fade-in">
                            <UserProfileSection />
                        </div>
                    )}

                    {/* Render Article Management Section */}
                    {activeSection === 'articles' && checkAccess(MODULES.ARTICLE_MANAGEMENT) && (
                        <ArticleManagement activeLanguage={localStorage.getItem('preferredLanguage') || 'telugu'} />
                    )}

            {/* REJECT MODAL */}
            {
                rejectModal && (
                    <div className="modal-overlay-refined">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>Reject Request</h3>
                                <button className="close-btn" onClick={() => setRejectModal(false)}><i className="fas fa-times"></i></button>
                            </div>
                            <div className="modal-body">
                                <p>Please provide a reason for rejecting this request:</p>
                                <textarea
                                    rows="4"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="e.g. Insufficient documentation or invalid details..."
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setRejectModal(false)}>Cancel</button>
                                <button className="btn-confirm-reject" onClick={confirmReject}>Confirm Rejection</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DELETE/ACTIVATE MODAL */}
            {
                deleteModal && (
                    <div className="modal-overlay-refined">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>Confirm {deleteType === 'activate_role' ? 'Reactivation' : 'Action'}</h3>
                                <button className="close-btn" onClick={() => setDeleteModal(false)}><i className="fas fa-times"></i></button>
                            </div>
                            <div className="modal-body">
                                <div className={`warning-icon-big ${deleteType === 'activate_role' ? 'success' : ''}`}>
                                    <i className={deleteType === 'activate_role' ? "fas fa-check-circle" : "fas fa-exclamation-triangle"}></i>
                                </div>
                                <p>Are you sure you want to <strong>
                                    {deleteType === 'role' ? 'inactivate' :
                                        deleteType === 'activate_role' ? 'reactivate' : 'delete'}
                                </strong> the following?</p>
                                <div className="target-value">{deleteValue}</div>
                                <p className="warning-text">
                                    {deleteType === 'activate_role'
                                        ? "Users will be able to register with this role immediately."
                                        : `This action may disrupt users currently assigned to this ${deleteType}.`}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setDeleteModal(false)}>Cancel</button>
                                <button
                                    className={deleteType === 'activate_role' ? "btn-confirm-approve" : "btn-confirm-delete"}
                                    onClick={handleDelete}
                                >
                                    {deleteType === 'activate_role' ? "Yes, Reactivate" : "Yes, I'm Sure"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ================= PREMIUM QUESTION SLIDE-OVER ================= */}
            <div className={`slide-over-overlay ${showQuestionModal ? 'active' : ''}`} onClick={() => setShowQuestionModal(false)}>
                <div className={`slide-over-content ${showQuestionModal ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="slide-over-header">
                        <div className="header-info">
                            <h3><i className="fas fa-layer-group"></i> {isEditingQuestion ? 'Edit Question' : 'Quiz Batch Creator'}</h3>
                            <p>{isEditingQuestion ? `Editing Question #${editingQuestionId}` : `You are editing ${questionList.length} question(s) in this batch`}</p>
                        </div>
                        <button className="close-panel-btn" onClick={() => setShowQuestionModal(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="slide-over-body">
                        {questionList.map((q, index) => (
                            <div key={index} className="bulk-question-card">
                                <div className="card-top-bar">
                                    <span className="q-badge">Question #{isEditingQuestion ? editingQuestionId : index + 1}</span>
                                    {!isEditingQuestion && questionList.length > 1 && (
                                        <button className="remove-q-btn" onClick={() => removeQuestionField(index)}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    )}
                                </div>

                                <div className="form-group-premium">
                                    <label><i className="fas fa-align-left"></i> Question Stem</label>
                                    <textarea
                                        name="question"
                                        placeholder="Enter question text..."
                                        value={q.question}
                                        onChange={(e) => handleQuestionChange(index, e)}
                                        rows="3"
                                    />
                                </div>

                                <div className="options-input-grid-premium">
                                    {[
                                        { id: 'option1', label: 'A' },
                                        { id: 'option2', label: 'B' },
                                        { id: 'option3', label: 'C' },
                                        { id: 'option4', label: 'D' }
                                    ].map((opt) => (
                                        <div key={opt.id} className="premium-opt-field">
                                            <div className="opt-tag">{opt.label}</div>
                                            <input
                                                name={opt.id}
                                                value={q[opt.id]}
                                                onChange={(e) => handleQuestionChange(index, e)}
                                                placeholder={`Choice ${opt.label}`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group-premium">
                                    <label><i className="fas fa-check-double"></i> Correct Answers</label>
                                    <div className="multi-choice-selector">
                                        {['A', 'B', 'C', 'D'].map(key => (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`choice-pill ${q.correctAnswer && q.correctAnswer.includes(key) ? 'active' : ''}`}
                                                onClick={() => toggleCorrectOption(index, key)}
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isEditingQuestion && (
                            <button className="add-another-btn-fancy" onClick={addQuestionField}>
                                <i className="fas fa-plus"></i> Add Another Question
                            </button>
                        )}
                    </div>

                    <div className="slide-over-footer">
                        <div className="batch-stats">
                            {!isEditingQuestion && <><strong>{questionList.length}</strong> Questions Ready</>}
                        </div>
                        <div className="footer-actions">
                            <button className="btn-cancel-fancy" onClick={() => setShowQuestionModal(false)}>Discard</button>
                            <button className="btn-save-fancy" onClick={submitQuestion}>
                                <i className="fas fa-cloud-upload-alt"></i> {isEditingQuestion ? 'Save Changes' : 'Publish Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CMSLayout>
    );
};

export default Dashboard;
