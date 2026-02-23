import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { getUserContext, setUserContext, subscribeToAuthChanges } from '../../../services/api';
import '../../../styles/UserManagement.css';
import '../../../styles/Dashboard.css';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import { getRoleInitials } from '../../../utils/roleUtils';
import socketService, { connectWebSocket, disconnectWebSocket } from '../../../services/socket';
import { useRealTime } from '../../../hooks/useRealTime';
import { 
    fetchNotifications, 
    fetchAllNotifications, 
    fetchNotificationsByStatus, 
    markAsSeen, 
    markAllAsSeen, 
    approveRequest, 
    rejectRequest,
    fetchArticleNotifications,
    fetchArticleUnseenCount,
    markArticleSeen as markArticleSeenApi,
    resetArticleUnseenCount
} from '../../../services/notificationService';
import { useSnackbar } from '../../../context/SnackbarContext';
import API_CONFIG from '../../../config/api.config';
import CustomSelect from '../../../components/ui/CustomSelect';
import UserProfileSection from '../../../components/dashboard/UserProfileSection';
import { newsService } from '../../../services';
import ArticleManagement from '../../articles/pages/ArticleManagement';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useNotifications } from '../../../hooks/useNotifications';
// import { useActiveRoles, usePermissions } from '../../../hooks/useAccessControl'; // Moved to DashboardOverview

// Components
import DashboardOverview from './DashboardOverview';
import RoleManagement from './RoleManagement';
import PermissionManagement from './PermissionManagement';
import QuizManagement from './QuizManagement';
import MediaManagement from './MediaManagement';
import YoutubeManagement from './YoutubeManagement';
import NotificationItem from '../components/NotificationItem';




const Dashboard = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    // Global Hooks
    const { data: profile } = useUserProfile();

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
    const { role: userRole, email: userEmail } = getUserContext();
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

    // Stable Refs for scroll logic to prevent race conditions during state updates
    const pendingCursorRef = useRef(null);
    const archiveCursorRef = useRef(null);

    const [isLoadingPending, setIsLoadingPending] = useState(false);
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);
    const [totalPendingCount, setTotalPendingCount] = useState(0);
    const [totalArchiveCount, setTotalArchiveCount] = useState(0);
    const [overallUnseenCount, setOverallUnseenCount] = useState(0);
    const [articleUnseenCount, setArticleUnseenCount] = useState(0);
    const [suppressedNotificationIds, setSuppressedNotificationIds] = useState([]);

    const [articleFeed, setArticleFeed] = useState([]);
    const [isLoadingArticles, setIsLoadingArticles] = useState(false);
    const [hasMoreArticles, setHasMoreArticles] = useState(true);
    const [loadingMoreArticles, setLoadingMoreArticles] = useState(false);
    const articleCursorRef = useRef(null);
    const articleListRef = useRef(null);
    const articleSentinelRef = useRef(null);
    const isFetchingArticlesRef = useRef(false);

    const [hasMorePending, setHasMorePending] = useState(true);
    const [hasMoreArchive, setHasMoreArchive] = useState(true);
    const [loadingMorePending, setLoadingMorePending] = useState(false);
    const [loadingMoreArchive, setLoadingMoreArchive] = useState(false);

    const [pendingFilterDate, setPendingFilterDate] = useState('');
    const [archiveFilterDate, setArchiveFilterDate] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const [lastSeenAllAt, setLastSeenAllAt] = useState(() => {
        return localStorage.getItem('cv_last_seen_all') || null;
    });

    useEffect(() => {
        if (lastSeenAllAt) localStorage.setItem('cv_last_seen_all', lastSeenAllAt);
    }, [lastSeenAllAt]);

    const pendingListRef = useRef(null);
    const notificationListRef = useRef(null);
    const pendingSentinelRef = useRef(null);
    const archiveSentinelRef = useRef(null);
    const isFetchingPendingRef = useRef(false);
    const isFetchingArchiveRef = useRef(false);
    const initialLoadDone = useRef(null);
    const hasMorePendingRef = useRef(true);
    const hasMoreArchiveRef = useRef(true);

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

    const [showPopover, setShowPopover] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSectionState] = useState(searchParams.get('tab') || 'overview');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    useEffect(() => {
        if (activeSection === 'notifications' && userRole === 'CONTRIBUTOR') {
            setActiveSectionState('overview');
            navigate('/dashboard?tab=overview', { replace: true });
            showSnackbar("Access Denied: You don't have permission to view notifications.", "error");
        }
    }, [activeSection, userRole, navigate, showSnackbar]);

    const setActiveSection = (section) => {
        // Redirect to standalone pages for modules that define their own CMSLayout
        if (section === 'users') {
            navigate('/user-management');
            return;
        }
        if (section === 'media') {
            navigate('/cms/media');
            return;
        }
        if (section === 'academics') {
            navigate('/cms/academics');
            return;
        }
        if (section === 'taxonomy') {
            navigate('/cms/taxonomy');
            return;
        }
        if (section === 'youtube') {
            setActiveSectionState(section);
            setSearchParams({ tab: section });
            return;
        }

        setActiveSectionState(section);
        setSearchParams({ tab: section });
    };

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
            // { id: 'notif-main', title: 'Notifications Center', keywords: ['alerts', 'notifications', 'messages', 'seen', 'unseen', 'bell'], section: 'notifications' },
            // { id: 'notif-archive', title: 'Notification Archive', keywords: ['history', 'older', 'past', 'archive', 'records', 'logs'], section: 'notifications', ref: archiveRef },

            // Profile
            { id: 'profile', title: 'My Profile', keywords: ['profile', 'account', 'edit profile', 'my account', 'avatar'], section: 'profile', ref: profileRef },
        ];

        if (userRole !== 'CONTRIBUTOR') {
            items.push(
                { id: 'notif-main', title: 'Notifications Center', keywords: ['alerts', 'notifications', 'messages', 'seen', 'unseen', 'bell'], section: 'notifications' },
                { id: 'notif-archive', title: 'Notification Archive', keywords: ['history', 'older', 'past', 'archive', 'records', 'logs'], section: 'notifications', ref: archiveRef }
            );
        }

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
        if (userRole !== 'CONTRIBUTOR') {
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
        }

        // 5. Dynamic Data: Index Pending Notifications
        if (userRole !== 'CONTRIBUTOR') {
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
        }

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


    /* ================= UNIFIED NOTIFICATION LOADING ================= */
    const extractTotalCount = useCallback((data, items) => {
        const total = data?.totalElements ||
            data?.total ||
            data?.totalCount ||
            data?.count ||
            data?.page?.totalElements ||
            data?.metadata?.total;

        const currentCount = Array.isArray(items) ? items.length : 0;
        return (total !== undefined && total !== null) ? total : currentCount;
    }, []);

    const fetchUnseenCount = useCallback(async () => {
        if (!userRole || userRole === 'CONTRIBUTOR') return;
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
            setTotalPendingCount(prev => Math.max(prev, metadataTotal));

            // Fetch Article Unseen Count
            try {
                const aCount = await fetchArticleUnseenCount();
                setArticleUnseenCount(aCount);
                // Update overall count
                setOverallUnseenCount(prev => prev + aCount);
            } catch (aErr) {
                console.error("Failed to fetch article unseen count", aErr);
            }
        } catch (err) {
            console.error("Failed to fetch unseen count", err);
        }
    }, [userRole, lastSeenAllAt, suppressedNotificationIds, extractTotalCount]);

    const loadPendingFeed = useCallback(async (reset = false) => {
        if (!userRole || userRole === 'CONTRIBUTOR' || isFetchingPendingRef.current) return;
        const isFirstLoad = reset || !pendingCursorRef.current;
        if (!isFirstLoad && !hasMorePendingRef.current) return;

        if (reset) {
            setIsLoadingPending(true);
            pendingCursorRef.current = null;
            hasMorePendingRef.current = true;
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

            if (rawItems.length > 0) {
                const lastRaw = rawItems[rawItems.length - 1];
                pendingCursorRef.current = {
                    id: lastRaw.id,
                    timestamp: lastRaw.localDateTime || lastRaw.timestamp || new Date().toISOString()
                };
            }

            const items = rawItems.filter(n => n.notificationStatus === 'PENDING');
            const metadataTotal = extractTotalCount(data, rawItems);

            if (reset) {
                setTotalPendingCount(metadataTotal);
            } else {
                setTotalPendingCount(prev => Math.max(prev, metadataTotal));
            }

            setPendingFeed(prev => {
                if (reset) return items;
                const newItems = items.filter(n => !prev.some(p => String(p.id) === String(n.id)));
                return [...prev, ...newItems];
            });

            const more = rawItems.length >= 20;
            hasMorePendingRef.current = more;
            setHasMorePending(more);
        } catch (err) {
            console.error("Failed to fetch pending notifications", err);
        } finally {
            setIsLoadingPending(false);
            setLoadingMorePending(false);
            isFetchingPendingRef.current = false;
        }
    }, [userRole, extractTotalCount]);

    const loadArchiveFeed = useCallback(async (reset = false) => {
        if (!userRole || userRole === 'CONTRIBUTOR' || isFetchingArchiveRef.current) return;
        const isFirstLoad = reset || !archiveCursorRef.current;
        if (!isFirstLoad && !hasMoreArchiveRef.current) return;

        if (reset) {
            setIsLoadingArchive(true);
            archiveCursorRef.current = null;
            hasMoreArchiveRef.current = true;
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

            const items = rawItems.filter(n => n.notificationStatus !== 'PENDING' && n.notificationStatus !== undefined);
            const metadataTotal = extractTotalCount(data, rawItems);

            if (reset) {
                setTotalArchiveCount(metadataTotal);
            } else {
                setTotalArchiveCount(prev => Math.max(prev, metadataTotal));
            }

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

            const more = rawItems.length >= 20;
            hasMoreArchiveRef.current = more;
            setHasMoreArchive(more);
        } catch (err) {
            console.error("Failed to fetch archive notifications", err);
        } finally {
            setIsLoadingArchive(false);
            setLoadingMoreArchive(false);
            isFetchingArchiveRef.current = false;
        }
    }, [userRole, extractTotalCount]);

    const loadArticleFeed = useCallback(async (reset = false) => {
        if (userRole === 'CONTRIBUTOR' || isFetchingArticlesRef.current) return;
        const isFirstLoad = reset || !articleCursorRef.current;
        if (!isFirstLoad && !hasMoreArticles) return;

        if (reset) {
            setIsLoadingArticles(true);
            articleCursorRef.current = null;
        } else {
            setLoadingMoreArticles(true);
        }
        isFetchingArticlesRef.current = true;

        try {
            const params = isFirstLoad ? { size: 20 } : {
                size: 20,
                createdAt: articleCursorRef.current.createdAt,
                cursorId: articleCursorRef.current.id
            };
            
            const data = await fetchArticleNotifications(params);
            const items = Array.isArray(data) ? data : (data?.content || []);

            if (items.length > 0) {
                const last = items[items.length - 1];
                articleCursorRef.current = {
                    id: last.notificationId || last.id,
                    createdAt: last.createdAt
                };
            }

            setArticleFeed(prev => {
                if (reset) return items;
                const newItems = items.filter(n => !prev.some(p => String(p.id) === String(n.id)));
                return [...prev, ...newItems];
            });

            setHasMoreArticles(items.length >= 20);
        } catch (err) {
            console.error("Failed to fetch article notifications", err);
        } finally {
            setIsLoadingArticles(false);
            setLoadingMoreArticles(false);
            isFetchingArticlesRef.current = false;
        }
    }, [hasMoreArticles, userRole]);



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

    useEffect(() => {
        if (!userRole || initialLoadDone.current === userRole) return;
        initialLoadDone.current = userRole;
        loadPendingFeed(true);
        loadArchiveFeed(true);
        loadArticleFeed(true);
        fetchUnseenCount();
        
        // If landing on notifications page directly
        if (activeSection === 'notifications') {
            resetArticleUnseenCount().catch(() => {});
        }
    }, [userRole, loadPendingFeed, loadArchiveFeed, loadArticleFeed, fetchUnseenCount, activeSection]);

    /* ================= EFFICIENT container-aware SCROLL DETECTION ================= */
    /* ================= EFFICIENT container-aware SCROLL DETECTION ================= */
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '100px' // Fetch earlier
        };

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

        let artObserver = null;
        const artList = articleListRef.current;
        const artSentinel = articleSentinelRef.current;
        if (artList && artSentinel && hasMoreArticles && activeSection === 'notifications') {
            artObserver = new IntersectionObserver((entries) => {
                if (entries.some(e => e.isIntersecting) && !isFetchingArticlesRef.current) {
                    loadArticleFeed(false);
                }
            }, { ...observerOptions, root: artList });
            artObserver.observe(artSentinel);
        }

        return () => {
            if (pObserver) pObserver.disconnect();
            if (aObserver) aObserver.disconnect();
            if (artObserver) artObserver.disconnect();
        };
    }, [
        hasMorePending, hasMoreArchive, hasMoreArticles, 
        activeSection, 
        loadPendingFeed, loadArchiveFeed, loadArticleFeed,
        pendingFeed.length, archiveFeed.length, articleFeed.length
    ]);

    /* ================= WEBSOCKET ================= */
    useRealTime(
        [`/topic/approvals/${userRole}`],
        (n) => {
            if (n.notificationStatus === 'PENDING') {
                setPendingFeed(prev => {
                    if (prev.some(x => x.id === n.id)) return prev;
                    setTotalPendingCount(c => c + 1);
                    setOverallUnseenCount(c => c + 1);
                    return [n, ...prev];
                });
            } else if (n.type === 'ARTICLE_SUBMISSION' || n.type === 'ARTICLE_PUBLISHED') {
                setArticleFeed(prev => {
                    if (prev.some(x => x.id === n.id)) return prev;
                    setArticleUnseenCount(c => c + 1);
                    setOverallUnseenCount(c => c + 1);
                    return [n, ...prev];
                });
            } else {
                setArchiveFeed(prev => {
                    if (prev.some(x => x.id === n.id)) return prev;
                    setTotalArchiveCount(c => c + 1);
                    return [n, ...prev];
                });
            }
        },
        { enabled: !!userRole && userRole !== 'CONTRIBUTOR' }
    );

    /* ================= APPROVE ================= */
    const handleApprove = async (id) => {
        try {
            await approveRequest(id);
            setSuppressedNotificationIds(prev => [...prev, id]);
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
            setSuppressedNotificationIds(prev => [...prev, selectedNotificationId]);
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
            showSnackbar("All notifications marked as seen", "success");
        } catch (err) {
            handleApiError(err, "Failed to clear notifications");
        }
    };

    /* ================= LOGOUT ================= */

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

    const sidebarProps = {
        activeSection,
        setActiveSection,
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
        onProfileClick: () => setActiveSection('profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>


                    {/* Render Overview Section */}
                    {activeSection === 'overview' && (
                        <DashboardOverview 
                            totalPendingCount={totalPendingCount}
                            isLoadingPending={isLoadingPending}
                            pendingNotifications={pendingNotifications}
                            handleApprove={handleApprove}
                            openRejectModal={openRejectModal}
                            handleMarkAsSeen={handleMarkAsSeen}
                            lastSeenAllAt={lastSeenAllAt}
                            setActiveSection={setActiveSection}
                        />
                    )}

                    {/* Render Roles Management Section */}
                    {activeSection === 'roles' && checkAccess(MODULES.ROLE_CONTROL) && (
                         <RoleManagement />
                    )}

                    {/* Render Permissions Section */}
                    {activeSection === 'permissions' && checkAccess(MODULES.PERMISSIONS) && (
                        <PermissionManagement />
                    )}
                    {/* Render Quizzes Section */}
                    {activeSection === 'quizzes' && (
                        <QuizManagement />
                    )}

                    {/* Render Full Notifications Section */}
                    {activeSection === 'notifications' && userRole !== 'CONTRIBUTOR' && (
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
                                            <span className="count-pill">
                                                {pendingFilterDate ? `${pendingNotifications.length} found` : `${pendingNotifications.length}`}
                                            </span>
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
                                                isSuppressed={lastSeenAllAt && n.timestamp && new Date(n.timestamp) <= new Date(lastSeenAllAt)}
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

                            {/* ARTICLE ALERTS SECTION */}
                            <div className="dashboard-section" style={{ marginTop: '3rem' }}>
                                <div className="section-title-row">
                                    <div className="title-stack">
                                        <div className="title-with-count">
                                            <h3><i className="fas fa-file-invoice"></i> Article Alerts</h3>
                                            {articleUnseenCount > 0 && <span className="count-pill">{articleUnseenCount} new</span>}
                                        </div>
                                        <p className="subtitle-mini">Publishing & Review status updates</p>
                                    </div>
                                </div>

                                <div className="approvals-grid" ref={articleListRef} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {articleFeed.length === 0 && !isLoadingArticles ? (
                                        <div className="empty-state-card" style={{ padding: '2rem' }}>
                                            <i className="fas fa-info-circle" style={{ color: 'var(--blue)' }}></i>
                                            <p>No article updates yet.</p>
                                        </div>
                                    ) : (
                                        articleFeed.map(n => (
                                            <NotificationItem
                                                key={n.notificationId || n.id}
                                                notification={n}
                                                onMarkSeen={async () => {
                                                    try {
                                                        await markArticleSeenApi(n.notificationId || n.id);
                                                        setArticleFeed(prev => prev.map(item => 
                                                            (item.notificationId || item.id) === (n.notificationId || n.id) ? { ...item, seen: true } : item
                                                        ));
                                                        setArticleUnseenCount(c => Math.max(0, c - 1));
                                                        setOverallUnseenCount(c => Math.max(0, c - 1));
                                                    } catch (err) {
                                                        console.error("Failed to mark article as seen", err);
                                                    }
                                                }}
                                                isArchive={true} // Use archive style for highlighting
                                            />
                                        ))
                                    )}

                                    {isLoadingArticles && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Fetching alerts...</p>
                                        </div>
                                    )}

                                    {loadingMoreArticles && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Loading more...</p>
                                        </div>
                                    )}

                                    {!hasMoreArticles && articleFeed.length > 0 && (
                                        <div className="empty-state-card" style={{ padding: '1rem', background: 'transparent' }}>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>No more alerts</p>
                                        </div>
                                    )}

                                    {hasMoreArticles && (
                                        <div ref={articleSentinelRef} style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)', opacity: 0.5 }}></i>
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
                                                isSuppressed={false}
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

                    {/* Render Youtube Management Section */}
                    {activeSection === 'youtube' && (
                        <YoutubeManagement />
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


        </CMSLayout>
    );
};

export default Dashboard;
