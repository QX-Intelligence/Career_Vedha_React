import React, { useRef } from 'react';
import LuxuryTooltip from '../ui/LuxuryTooltip';

const CMSNavbar = ({ 
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
}) => {
    const searchContainerRef = useRef(null);

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
                {!notificationPopover && (
                    <div className="notification-bell-container">
                        <div className="notification-bell" onClick={() => setShowPopover && setShowPopover(prev => !prev)}>
                            <i className="far fa-bell"></i>
                            {overallUnseenCount > 0 && <span className="bell-badge">{overallUnseenCount}</span>}
                        </div>
                    </div>
                )}
                {notificationPopover}

                <div className="top-user-profile">
                    <div className="user-info-text">
                        <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {userFullName || userEmail}
                            {userStatus !== null && (
                                <LuxuryTooltip content={userStatus ? 'Active' : 'Inactive'}>
                                    <span className={`status-dot-mini ${userStatus ? 'active' : 'inactive'}`}></span>
                                </LuxuryTooltip>
                            )}
                        </span>
                        <span className="user-role">{userRole}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CMSNavbar;
