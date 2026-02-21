import React from 'react';

const NotificationItem = React.memo(({ notification, onApprove, onReject, onMarkSeen, isArchive, isSuppressed = false, lastSeenAllAt }) => {
    // Format timestamp helper
    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    };

    const timeAgo = getRelativeTime(notification.createdAt || notification.timestamp || notification.localDateTime);

    // Highlight logic: if active tab is PENDING, we don't highlight. 
    // If active tab is ARCHIVE (isArchive=true), we highlight UNSEEN items.
    // Also if notification is newer than lastSeenAllAt, it's unseen.
    const isUnseen = !notification.seen && (!lastSeenAllAt || new Date(notification.createdAt) > new Date(lastSeenAllAt));
    const shouldHighlight = isArchive && isUnseen;

    return (
        <div className={`notification-card-modern ${shouldHighlight ? 'unread' : ''} ${isArchive ? 'archived' : ''}`}>
            <div className="notification-card-header">
                <div className="notification-avatar">
                    <i className={notification.type === 'ARTICLE_SUBMISSION' ? "fas fa-file-alt" : "fas fa-bell"}></i>
                </div>
                <div className="notification-header-content">
                    <div className="notification-title-row">
                        <h4 className="notification-title">{notification.type?.replace('_', ' ')}</h4>
                        <span className="notification-time">{timeAgo}</span>
                    </div>
                    <div className="notification-message">{notification.message}</div>
                </div>
                {isArchive && !notification.seen && (
                    <button className="mark-read-btn" title="Mark as seen" onClick={() => onMarkSeen(notification.id)}>
                        <div className="read-dot"></div>
                    </button>
                )}
            </div>

            {/* Actions Row */}
            {!isArchive && notification.notificationStatus === 'PENDING' && (
                <div className="notification-card-footer">
                    <button className="btn-reject" onClick={() => onReject(notification.id)}>
                        <i className="fas fa-times"></i> Reject
                    </button>
                    <button className="btn-approve" onClick={() => onApprove(notification.id)}>
                        <i className="fas fa-check"></i> Approve
                    </button>
                </div>
            )}
        </div>
    );
});

export default NotificationItem;
