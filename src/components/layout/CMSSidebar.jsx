import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleInitials } from '../../utils/roleUtils';

const CMSSidebar = ({ 
    activeSection, 
    setActiveSection, 
    userRole, 
    userEmail, 
    userFullName, 
    userStatus,
    checkAccess,
    MODULES,
    onLogout,
    isCmsOpen,
    setIsCmsOpen
}) => {
    const navigate = useNavigate();

    const handleMenuClick = (section) => {
        if (typeof setActiveSection === 'function') {
            setActiveSection(section);
        } else {
            // If we're not on the dashboard (e.g. Article Editor), navigate back to dashboard with tab
            navigate(`/dashboard?tab=${section}`);
        }
    };

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-brand">
                <div className="brand-logo-circle"><i className="fas fa-graduation-cap"></i></div>
                <span>Career Vedha</span>
            </div>

            <nav className="sidebar-menu">
                <button
                    className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
                    onClick={() => handleMenuClick('overview')}
                >
                    <i className="fas fa-tachometer-alt"></i>
                    <span>Overview</span>
                </button>
                {checkAccess(MODULES.USER_MANAGEMENT) && (
                    <button
                        className={`menu-item ${activeSection === 'users' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('users')}
                    >
                        <i className="fas fa-users-cog"></i>
                        <span>Users</span>
                    </button>
                )}

                {checkAccess(MODULES.QUIZ_MANAGER) && (
                    <button
                        className={`menu-item ${activeSection === 'quizzes' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('quizzes')}
                    >
                        <i className="fas fa-brain"></i>
                        <span>Quizzes</span>
                    </button>
                )}

                {checkAccess(MODULES.ROLE_CONTROL) && (
                    <button
                        className={`menu-item ${activeSection === 'roles' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('roles')}
                    >
                        <i className="fas fa-user-shield"></i>
                        <span>Roles</span>
                    </button>
                )}

                {checkAccess(MODULES.PERMISSIONS) && (
                    <button
                        className={`menu-item ${activeSection === 'permissions' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('permissions')}
                    >
                        <i className="fas fa-key"></i>
                        <span>Permissions</span>
                    </button>
                )}

                <button
                    className={`menu-item ${activeSection === 'notifications' ? 'active' : ''}`}
                    onClick={() => handleMenuClick('notifications')}
                >
                    <i className="fas fa-bell"></i>
                    <span>Notifications</span>
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
                        {checkAccess(MODULES.ARTICLE_MANAGEMENT) && (
                            <button
                                className={`menu-item ${activeSection === 'articles' ? 'active' : ''}`}
                                onClick={() => handleMenuClick('articles')}
                                style={{ paddingLeft: '40px' }}
                            >
                                <i className="fas fa-file-invoice"></i>
                                <span>Articles</span>
                            </button>
                        )}

                        {checkAccess(MODULES.JOB_MANAGEMENT) && (
                            <button
                                className={`menu-item ${activeSection === 'jobs' ? 'active' : ''}`}
                                onClick={() => navigate('/cms/jobs')}
                                style={{ paddingLeft: '40px' }}
                            >
                                <i className="fas fa-briefcase"></i>
                                <span>Jobs</span>
                            </button>
                        )}
                        
                        <button
                            className={`menu-item ${activeSection === 'taxonomy' ? 'active' : ''}`}
                            onClick={() => navigate('/cms/taxonomy')}
                            style={{ paddingLeft: '40px' }}
                        >
                            <i className="fas fa-tags"></i>
                            <span>Taxonomy</span>
                        </button>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="avatar">
                        {getRoleInitials(userRole)}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{userFullName || userEmail || 'User'}</span>
                        <span className="user-role-badge">{userRole}</span>
                    </div>
                </div>
                <button className="logout-button-alt" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default CMSSidebar;
