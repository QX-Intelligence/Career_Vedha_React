import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../ui/LuxuryTooltip';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getUserContext } from '../../services/api';

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
    const navigate = useNavigate();
    
    // Global Hooks
    const { data: profile } = useUserProfile();
    const { 
        unseenCount, 
        unseenItems, 
        markSeen, 
        markAllSeen, 
        approve, 
        reject 
    } = useNotifications();
    const { role, email } = getUserContext();

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

    const handleViewAll = () => {
        setShowPopover(false);
        navigate('/admin-dashboard?tab=notifications');
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
                <div className="notification-bell-container" ref={notificationContainerRef}>
                    <div className="notification-bell" onClick={() => setShowPopover(!showPopover)}>
                        <i className="far fa-bell"></i>
                        {unseenCount > 0 && <span className="bell-badge">{unseenCount}</span>}
                    </div>

                    {showPopover && (
                        <div className="notification-popover">
                            <div className="popover-header">
                                <span>New Alerts ({unseenCount})</span>
                                {unseenCount > 0 && (
                                    <button className="mark-all-btn" onClick={() => markAllSeen()}>Mark all seen</button>
                                )}
                            </div>
                            <div className="popover-list">
                                {unseenCount === 0 ? (
                                    <div className="popover-empty">
                                        <i className="fas fa-bell-slash"></i>
                                        <p>No new alerts</p>
                                    </div>
                                ) : (
                                    unseenItems.slice(0, 10).map(n => (
                                        <PopoverItem
                                            key={n.id}
                                            notification={n}
                                            onApprove={(id) => { approve(id); setShowPopover(false); }}
                                            onReject={(id) => { 
                                                // For now, simple reject without reason to match hook
                                                // If we need a modal, we can add it later
                                                reject({ id }); 
                                                setShowPopover(false); 
                                            }}
                                            onMarkSeen={markSeen}
                                        />
                                    ))
                                )}
                            </div>
                            <div className="popover-footer" onClick={handleViewAll}>
                                View All History
                            </div>
                        </div>
                    )}
                </div>

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
