import React, { useState, useEffect } from 'react';
import { useActiveRoles, usePermissions } from '../../../hooks/useAccessControl';
import { getUserContext } from '../../../services/api'; 
import { useArticles } from '../../../hooks/useArticles';
import { useMediaList } from '../../../hooks/useMedia';
import { useQuizQuestions } from '../../../hooks/useQuiz';
import { newsService } from '../../../services';
import NotificationItem from '../components/NotificationItem';
import { useSnackbar } from '../../../context/SnackbarContext';
import '../../../styles/Dashboard.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Skeleton, { SkeletonChart } from '../../../components/ui/Skeleton';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardOverview = ({ 
    totalPendingCount, 
    isLoadingPending,
    pendingNotifications, 
    handleApprove, 
    openRejectModal, 
    handleMarkAsSeen, 
    lastSeenAllAt,
    setActiveSection 
}) => {
    const { data: roles, isLoading: loadingRoles } = useActiveRoles();
    const { data: permissions, isLoading: loadingPermissions } = usePermissions();
    const { data: articlesData, isLoading: loadingArticles } = useArticles({ status: 'all' });
    const { data: mediaData, isLoading: loadingMedia } = useMediaList({});
    const { data: quizzesData, isLoading: loadingQuizzes } = useQuizQuestions(0, 100); 
    const { role: userRole } = getUserContext();
    const [homeData, setHomeData] = useState({ featured: [], trending: [] });
    const [loadingHome, setLoadingHome] = useState(true);
    const [notificationStats, setNotificationStats] = useState({ approved: 0, rejected: 0 });
    const { showSnackbar } = useSnackbar();

    // Calculate real-time counts with robust fallbacks
    const articlesCount = articlesData?.count ?? articlesData?.results?.length ?? articlesData?.length ?? 0;
    const mediaCount = mediaData?.count ?? mediaData?.results?.length ?? mediaData?.length ?? 0;
    const quizzesCount = quizzesData?.totalElements ?? quizzesData?.content?.length ?? quizzesData?.length ?? 0;
    const jobsCount = 0; // TODO: Add useJobs hook when available

    // Fetch Overview Content (Home Data)
    useEffect(() => {
        const loadHomeContent = async () => {
            try {
                const data = await newsService.getHomeContent();
                setHomeData(data || { featured: [], trending: [] });
            } catch (err) {
                console.error("Failed to load home content", err);
            } finally {
                setLoadingHome(false);
            }
        };
        loadHomeContent();
    }, []);

    // Calculate notification statistics (mock calculation based on pending count)
    // In a real app, you'd fetch this from an API endpoint
    useEffect(() => {
        // Estimate based on typical approval/rejection ratios
        const estimatedTotal = totalPendingCount * 3; // Assume pending is ~33% of total
        setNotificationStats({
            approved: Math.floor(estimatedTotal * 0.6),
            rejected: Math.floor(estimatedTotal * 0.07)
        });
    }, [totalPendingCount]);

    return (
        <div className="section-fade-in dashboard-overview">
            <div className="page-header-row">
                <div>
                    <h1>Overview</h1>
                    <p className="subtitle">Welcome back! Here is what's happening today.</p>
                </div>
                <div className="date-display">
                    <i className="far fa-calendar-alt"></i>
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Summary Stats Card Row */}
            <div className="stats-row">
                <div className="stat-card" onClick={() => setActiveSection('notifications')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon yellow"><i className="fas fa-user-clock"></i></div>
                    <div className="stat-data">
                        <span className="stat-value">{isLoadingPending ? <Skeleton width="40px" height="24px" /> : totalPendingCount}</span>
                        <span className="stat-label">Pending Req</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setActiveSection('roles')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon blue"><i className="fas fa-user-shield"></i></div>
                    <div className="stat-data">
                        <span className="stat-value">{loadingRoles ? <Skeleton width="40px" height="24px" /> : (roles?.length || 0)}</span>
                        <span className="stat-label">Total Roles</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => setActiveSection('permissions')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><i className="fas fa-key"></i></div>
                    <div className="stat-data">
                        <span className="stat-value">{loadingPermissions ? <Skeleton width="40px" height="24px" /> : (permissions?.length || 0)}</span>
                        <span className="stat-label">Permissions</span>
                    </div>
                </div>
            </div>

            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
                
                {/* Left Col: Activity & Featured */}
                <div className="overview-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Pending Approvals Section */}
                    <div className="dashboard-section">
                        <div className="section-title-row">
                            <h3><i className="fas fa-clock-rotate-left"></i> Recent Activity</h3>
                            <span className="count-pill">
                                {isLoadingPending ? <Skeleton width="60px" height="18px" /> : `${pendingNotifications?.slice(0, 5).length || 0} of ${totalPendingCount} pending`}
                            </span>
                        </div>

                        <div className="approvals-grid">
                            {isLoadingPending ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} variant="card" height="80px" />
                                    ))}
                                </div>
                            ) : !pendingNotifications || pendingNotifications.length === 0 ? (
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
                            {totalPendingCount > 5 && !isLoadingPending && (
                                <button className="view-more-btn" onClick={() => setActiveSection('notifications')}>
                                    View all notifications
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Featured Content Quick View */}
                    <div className="dashboard-section">
                        <div className="section-title-row">
                            <h3><i className="fas fa-thumbtack"></i> Live Featured Content</h3>
                            <button className="m-btn-text" onClick={() => setActiveSection('articles')}>Manage All</button>
                        </div>
                        
                        {loadingHome ? (
                            <div className="management-grid-refined" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <Skeleton variant="card" height="200px" />
                                <Skeleton variant="card" height="200px" />
                            </div>
                        ) : (
                            <div className="management-grid-refined" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Featured List */}
                                <div className="m-card" style={{ borderLeft: '4px solid var(--danger)' }}>
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
                                                    <span style={{ fontWeight: '500' }}>{h.title || h.summary || 'Untitled Story'}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!homeData.featured || homeData.featured.length === 0) && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No featured stories pinned.</p>}
                                    </div>
                                </div>

                                {/* Trending List */}
                                <div className="m-card" style={{ borderLeft: '4px solid var(--primary-yellow)' }}>
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
                        )}
                    </div>
                </div>

                {/* Right Col: Charts & Quick Actions */}
                <div className="overview-side-col">
                    {/* Notification Statistics Chart */}
                    <div className="stat-card no-hover-transform" style={{ display: 'block', height: 'auto', alignItems: 'normal', marginBottom: '1.5rem' }}>
                        <div className="section-title-row" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}><i className="fas fa-chart-pie"></i> Notification Status</h3>
                        </div>
                        <div style={{ padding: '1rem', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isLoadingPending ? (
                                <SkeletonChart variant="doughnut" height="200px" />
                            ) : (
                                <Doughnut 
                                    data={{
                                        labels: ['Pending', 'Approved', 'Rejected'],
                                        datasets: [{
                                            data: [
                                                totalPendingCount,
                                                notificationStats.approved,
                                                notificationStats.rejected
                                            ],
                                            backgroundColor: [
                                                '#facc15', // primary-yellow
                                                '#10b981', // success
                                                '#ef4444'  // danger
                                            ],
                                            borderColor: ['#fff', '#fff', '#fff'],
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    padding: 15,
                                                    font: { size: 11, weight: '600' },
                                                    color: '#64748b'
                                                }
                                            },
                                            tooltip: {
                                                backgroundColor: '#0f172a',
                                                padding: 12,
                                                titleFont: { size: 13, weight: '700' },
                                                bodyFont: { size: 12 },
                                                borderColor: '#facc15',
                                                borderWidth: 1
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* System Overview Chart */}
                    <div className="stat-card no-hover-transform" style={{ display: 'block', height: 'auto', alignItems: 'normal', marginBottom: '1.5rem' }}>
                        <div className="section-title-row" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}><i className="fas fa-chart-bar"></i> System Overview</h3>
                        </div>
                        <div style={{ padding: '1rem', height: '300px' }}>
                            {loadingArticles || loadingMedia || loadingQuizzes ? (
                                <SkeletonChart variant="bar" height="250px" />
                            ) : (
                                <Bar 
                                    data={{
                                        labels: userRole === 'CONTRIBUTOR' 
                                            ? ['Articles', 'Media'] 
                                            : ['Articles', 'Media', 'Quizzes', 'Jobs'],
                                        datasets: [{
                                            label: 'Total Items',
                                            data: userRole === 'CONTRIBUTOR'
                                                ? [articlesCount, mediaCount]
                                                : [articlesCount, mediaCount, quizzesCount, jobsCount],
                                            backgroundColor: [
                                                'var(--primary-yellow)', 
                                                'var(--success-green)', 
                                                '#444afc', 
                                                'var(--danger)'
                                            ].slice(0, userRole === 'CONTRIBUTOR' ? 2 : 4),
                                            borderRadius: 6,
                                            barThickness: 35
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                backgroundColor: '#0f172a',
                                                padding: 12,
                                                titleFont: { size: 13, weight: '700' },
                                                bodyFont: { size: 12 },
                                                borderColor: '#facc15',
                                                borderWidth: 1
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: { color: '#f1f5f9' },
                                                ticks: { color: '#64748b', font: { size: 11 } }
                                            },
                                            x: {
                                                ticks: {
                                                    color: '#334155',
                                                    font: { size: 11, weight: '600' }
                                                },
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="stat-card no-hover-transform" style={{ display: 'block', height: 'auto', alignItems: 'normal' }}>
                        <div className="section-title-row" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}><i className="fas fa-bolt"></i> Quick Actions</h3>
                        </div>
                        <div className="m-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                             <button type="button" className="btn-secondary-fancy" onClick={() => setActiveSection('articles')} style={{ width: '100%', justifyContent: 'flex-start', position: 'relative', zIndex: 10 }}>
                                <i className="fas fa-plus"></i> New Article
                            </button>
                             <button type="button" className="btn-secondary-fancy" onClick={() => setActiveSection('quizzes')} style={{ width: '100%', justifyContent: 'flex-start', position: 'relative', zIndex: 10 }}>
                                <i className="fas fa-plus"></i> New Quiz
                            </button>
                             <button type="button" className="btn-secondary-fancy" onClick={() => setActiveSection('users')} style={{ width: '100%', justifyContent: 'flex-start', position: 'relative', zIndex: 10 }}>
                                <i className="fas fa-user-plus"></i> Manage Users
                            </button>
                             <button type="button" className="btn-secondary-fancy" onClick={() => setActiveSection('media')} style={{ width: '100%', justifyContent: 'flex-start', position: 'relative', zIndex: 10 }}>
                                <i className="fas fa-images"></i> Manage Media
                            </button>
                        </div>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardOverview;
