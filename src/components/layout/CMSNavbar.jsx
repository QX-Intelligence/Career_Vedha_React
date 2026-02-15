import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../ui/LuxuryTooltip';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getUserContext } from '../../services/api';
import '../../styles/Notifications.css';

const ArticleNotificationItem = ({ item, onMarkSeen }) => (
    <div className={`notification-item-compact ${!item.seen ? 'unseen' : ''}`} onClick={() => !item.seen && onMarkSeen(item.notificationId)}>
        <div className="notification-icon-circle article">
            <i className="fas fa-file-alt"></i>
        </div>
        <div className="notification-content-compact">
            <p className="notification-text-compact">{item.message}</p>
            <div className="notification-time-compact">
                {new Date(item.createdAt).toLocaleString()}
                {!item.seen && <span className="unseen-dot" style={{ marginLeft: '8px' }}></span>}
            </div>
        </div>
    </div>
);

const ApprovalNotificationItem = ({ item, onApprove, onReject }) => (
    <div className="popover-item">
        <div className="popover-item-text">
            <div className="popover-item-header">
                <strong>{item.role} Request</strong>
                <span className="meta-item user">
                    <i className="fas fa-user-circle"></i> {item.email.split('@')[0]}
                </span>
            </div>
            <p className="popover-item-message">{item.message}</p>
            <div className="notification-time-compact">
                {new Date(item.localDateTime).toLocaleString()}
            </div>
        </div>
        <div className="popover-actions">
            <button className="popover-btn-approve" onClick={() => onApprove(item.id)}>Approve</button>
            <button className="popover-btn-reject" onClick={() => onReject(item.id)}>Reject</button>
        </div>
    </div>
);

const CMSNavbar = ({ 
    searchQuery, 
    handleSearch, 
    showSearchResults, 
    searchResults, 
    navigateToResult, 
    setShowSearchResults,
    onProfileClick
}) => {
    const searchContainerRef = useRef(null);
    const notificationContainerRef = useRef(null);
    const [showPopover, setShowPopover] = useState(false);
    const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' as default
    const navigate = useNavigate();
    
    // Refs for infinite scroll in popover
    const articleListRef = useRef(null);
    const articleSentinelRef = useRef(null);
    
    // Global Hooks
    const { data: profile } = useUserProfile();
    const { 
        totalUnseenCount,
        articleUnseenCount,
        articleItems,
        roleUnseenCount,
        roleItems,
        hasNextArticlesPage,
        fetchNextArticles,
        markArticleSeen,
        resetArticleUnseen,
        markRoleSeen,
        approve, 
        reject,
        isArticlesLoading
    } = useNotifications();
    const { role, email } = getUserContext();

    const handleTogglePopover = () => {
        const nextState = !showPopover;
        setShowPopover(nextState);
        if (nextState) {
            // Trigger reset when opening
            resetArticleUnseen();
        }
    };

    // Click outside handler for notifications
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Observer for Articles in Popover
    useEffect(() => {
        if (!showPopover || activeTab !== 'articles' || !hasNextArticlesPage) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isArticlesLoading) {
                fetchNextArticles();
            }
        }, {
            root: articleListRef.current,
            threshold: 0.1,
            rootMargin: '50px'
        });

        const sentinel = articleSentinelRef.current;
        if (sentinel) observer.observe(sentinel);
        return () => observer.disconnect();
    }, [showPopover, activeTab, hasNextArticlesPage, isArticlesLoading, fetchNextArticles, articleItems.length]);

    const handleMarkAllRoleSeen = () => {
        const unseenIds = roleItems.map(item => item.id);
        if (unseenIds.length > 0) {
            markRoleSeen(unseenIds);
        }
    };

    const handleViewAll = () => {
        setShowPopover(false);
        navigate('/dashboard?tab=notifications');
    };

    return (
        <header className="main-top-header">
            <div className="header-search" ref={searchContainerRef}>
                <i className="fas fa-search"></i>
                <input 
                    type="text" 
                    placeholder="Search anything (Try 'roles', 'new quiz', 'permissions')..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                
                {showSearchResults && (
                    <div className="search-results-dropdown">
                        {searchResults.length > 0 ? (
                            searchResults.map(item => (
                                <div key={item.id} className="search-item" onClick={() => navigateToResult(item)}>
                                    <div className="search-item-icon">
                                        <i className={item.section === 'roles' ? 'fas fa-user-shield' : 
                                                    item.section === 'permissions' ? 'fas fa-key' : 
                                                    item.section === 'quizzes' ? 'fas fa-brain' : 'fas fa-th-large'}></i>
                                    </div>
                                    <div className="search-item-info">
                                        <span className="search-item-title">{item.title}</span>
                                        <span className="search-item-path">{item.section} area</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="search-empty">No matching results found...</div>
                        )}
                    </div>
                )}
            </div>

            <div className="header-actions">
                {role !== 'CONTRIBUTOR' && (
                    <div className="notification-bell-container" ref={notificationContainerRef}>
                        <div className="notification-bell" onClick={handleTogglePopover}>
                            <i className={`far fa-bell ${totalUnseenCount > 0 ? 'pulse' : ''}`}></i>
                            {totalUnseenCount > 0 && <span className="bell-badge">{totalUnseenCount}</span>}
                        </div>

                        {showPopover && (
                            <div className="notification-popover">
                                <div className="popover-tabs-container luxury-switch-header">
                                    <div 
                                        className={`switch-label ${activeTab === 'approvals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('approvals')}
                                    >
                                        <i className="fas fa-user"></i>
                                        <span>Approvals</span>
                                        {roleUnseenCount > 0 && <span className="switch-badge">{roleUnseenCount}</span>}
                                    </div>

                                    <div 
                                        className={`luxury-physical-switch ${activeTab}`}
                                        onClick={() => setActiveTab(activeTab === 'approvals' ? 'articles' : 'approvals')}
                                    >
                                        <div className="switch-track">
                                            <div className="switch-knob">
                                                <div className="knob-inner"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        className={`switch-label ${activeTab === 'articles' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('articles')}
                                    >
                                        <i className="fas fa-file-alt"></i>
                                        <span>Articles</span>
                                        {articleUnseenCount > 0 && <span className="switch-badge">{articleUnseenCount}</span>}
                                    </div>
                                </div>

                                <div className="popover-header">
                                    <span>{activeTab === 'articles' ? 'Article Updates' : 'Role Requests'}</span>
                                    {activeTab === 'approvals' && roleUnseenCount > 0 && (
                                        <button className="mark-all-btn" onClick={handleMarkAllRoleSeen}>Mark all seen</button>
                                    )}
                                </div>

                                <div className="popover-list" ref={articleListRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {activeTab === 'articles' ? (
                                        articleItems.length === 0 ? (
                                            <div className="popover-empty">
                                                <i className="fas fa-bell-slash"></i>
                                                <p>No article updates</p>
                                            </div>
                                        ) : (
                                            <>
                                                {articleItems.map(n => (
                                                    <ArticleNotificationItem 
                                                        key={n.notificationId || n.id} 
                                                        item={n} 
                                                        onMarkSeen={markArticleSeen}
                                                    />
                                                ))}
                                                {hasNextArticlesPage && (
                                                    <div ref={articleSentinelRef} style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                                                        <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    ) : (
                                        roleItems.length === 0 ? (
                                            <div className="popover-empty">
                                                <i className="fas fa-check-circle"></i>
                                                <p>No pending approvals</p>
                                            </div>
                                        ) : (
                                            roleItems.map(n => (
                                                <ApprovalNotificationItem
                                                    key={n.id}
                                                    item={n}
                                                    onApprove={(id) => { approve(id); setShowPopover(false); }}
                                                    onReject={(id) => { reject({ id }); setShowPopover(false); }}
                                                />
                                            ))
                                        )
                                    )}
                                </div>
                                <div className="popover-footer" onClick={handleViewAll}>
                                    View All History
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="top-user-profile" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
                    <div className="user-info-text">
                        <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {(profile?.firstName || profile?.lastName) ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (email || 'User')}
                            {profile && profile.status !== undefined && (
                                <LuxuryTooltip content={profile.status ? 'Active' : 'Inactive'}>
                                    <span className={`status-dot-mini ${profile.status ? 'active' : 'inactive'}`}></span>
                                </LuxuryTooltip>
                            )}
                        </span>
                        <span className="user-role">{role}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CMSNavbar;
