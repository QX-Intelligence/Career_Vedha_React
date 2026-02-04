import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import { useSnackbar } from '../../../context/SnackbarContext';
import '../../../styles/UserManagement.css';
import '../../../styles/Dashboard.css';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import API_CONFIG from '../../../config/api.config';
import { getRoleInitials } from '../../../utils/roleUtils';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../../services/notificationService';
import CustomSelect from '../../../components/ui/CustomSelect';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';


const UserManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { role: userRole } = getUserContext();

    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    // Role Change state
    const [availableRoles, setAvailableRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [isSavingRole, setIsSavingRole] = useState(false);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    const fetchRoles = useCallback(async () => {
        if (userRole !== 'SUPER_ADMIN') return;
        try {
            const response = await api.get('/role-names');
            setAvailableRoles(response.data || []);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole === 'SUPER_ADMIN') {
            fetchRoles();
        }
    }, [userRole, fetchRoles]);

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const roleMutation = useMutation({
        mutationFn: async ({ email, roleName }) => {
            await api.put('/change-role', null, {
                params: { email, roleName }
            });
        },
        onSuccess: () => {
            showSnackbar('Role updated successfully!', 'success');
            queryClient.invalidateQueries(['users']);
            setShowRoleModal(false);
        },
        onError: (err) => {
            console.error('Error updating role:', err);
            showSnackbar(err.response?.data?.message || 'Failed to update role', 'error');
        },
        onSettled: () => {
            setIsSavingRole(false);
        }
    });

    const handleSaveRole = async () => {
        if (!selectedUser || !newRole) return;
        if (newRole === selectedUser.role) {
            setShowRoleModal(false);
            return;
        }

        setIsSavingRole(true);
        roleMutation.mutate({
            email: selectedUser.email,
            roleName: newRole
        });
    };


    // Use TanStack Query for user fetching
    const { 
        data: userData, 
        isLoading: loading, 
        error: queryError,
        isFetching
    } = useQuery({
        queryKey: ['users', activeTab, page, size, keyword],
        queryFn: async () => {
            let url = '';
            const params = { page, size };

            switch (activeTab) {
                case 'active':
                    url = '/get-active-users';
                    break;
                case 'inactive':
                    url = '/get-inactive-users';
                    break;
                case 'all':
                    url = '/get-all-users';
                    break;
                case 'search':
                    if (!keyword.trim()) {
                        return { content: [], totalPages: 0, totalElements: 0 };
                    }
                    url = '/search';
                    params.keyword = keyword;
                    break;
                default:
                    url = '/get-active-users';
            }

            const response = await api.get(url, { params });
            return response.data;
        },
        enabled: !!userRole,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    const users = userData?.content || [];
    const totalPages = userData?.totalPages || 0;
    const totalElements = userData?.totalElements || 0;
    const error = queryError?.response?.data?.message || queryError?.message || null;

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ email, currentStatus }) => {
            const endpoint = currentStatus ? '/inactivate-user' : '/activate-user';
            await api.put(endpoint, null, {
                params: { email },
            });
        },
        onSuccess: (_, variables) => {
            const action = variables.currentStatus ? 'deactivate' : 'activate';
            showSnackbar(`User ${action}d successfully!`, 'success');
            queryClient.invalidateQueries(['users']);
        },
        onError: (err, variables) => {
            const action = variables.currentStatus ? 'deactivate' : 'activate';
            console.error(`Error ${action}ing user:`, err);
            const errorMessage = err.response?.data?.message ||
                `You are not allowed to ${action} this user.`;
            showSnackbar(errorMessage, 'error');
        }
    });

    const handleToggleStatus = async (email, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        const confirmMessage = `Are you sure you want to ${action.toUpperCase()} this user?\n\nEmail: ${email}`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        toggleStatusMutation.mutate({ email, currentStatus });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setActiveTab('search');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(0);
        if (tab !== 'search') {
            setKeyword('');
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

    /* ================= GLOBAL SEARCH (NAVBAR) ================= */
    // Use the new shared hook for global search
    const {
        query: globalSearchQuery,
        results: globalSearchResults,
        search: handleGlobalSearchInput,
        clearSearch: clearGlobalSearch,
        isSearching: showGlobalSearchResults,
        setIsSearching: setShowGlobalSearchResults
    } = useGlobalSearch();

    const handleGlobalSearch = (e) => {
        handleGlobalSearchInput(e.target.value);
    };

    const navigateToGlobalResult = (item) => {
        if (item.section === 'user-management') {
            // If navigating within current page
            if (item.subSection) {
                if (item.subSection === 'active') setActiveTab('active');
                else if (item.subSection === 'inactive') setActiveTab('inactive');
                else if (item.subSection === 'all') setActiveTab('all');
            }
            clearGlobalSearch();
        } else {
            // Navigate to other dashboard sections
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    const checkAccess = useCallback((module) => {
        return checkAccessGlobal(userRole, module);
    }, [userRole]);

    // Prepare sidebar props for CMSLayout
    const sidebarProps = {
        activeSection: 'users',
        checkAccess,
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    // Prepare navbar props for CMSLayout
    const navbarProps = {
        title: "User Management",
        searchQuery: globalSearchQuery,
        handleSearch: handleGlobalSearch,
        showSearchResults: showGlobalSearchResults,
        searchResults: globalSearchResults,
        navigateToResult: navigateToGlobalResult,
        setShowSearchResults: setShowGlobalSearchResults,
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>

                    {/* Header */}
                    <div className="um-header">
                        <div className="um-header-content">
                            <div className="um-title-section">
                                <h1 className="um-title">
                                    <i className="fas fa-users-cog"></i>
                                    User Management
                                </h1>
                                <p className="um-subtitle">Manage user accounts and permissions</p>
                            </div>
                            <div className="um-stats">
                                <div className="um-stat-card">
                                    <i className="fas fa-users"></i>
                                    <div className="um-stat-info">
                                        <span className="um-stat-value">{totalElements}</span>
                                        <span className="um-stat-label">Total Users</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs and Search in Single Row */}
                    <div className="um-filter-bar">
                        <div className="um-tabs">
                            <button
                                className={`um-tab ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => handleTabChange('active')}
                            >
                                <i className="fas fa-check-circle"></i>
                                Active Users
                            </button>

                            <button
                                className={`um-tab ${activeTab === 'inactive' ? 'active' : ''}`}
                                onClick={() => handleTabChange('inactive')}
                            >
                                <i className="fas fa-times-circle"></i>
                                Inactive Users
                            </button>

                            <button
                                className={`um-tab ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => handleTabChange('all')}
                            >
                                <i className="fas fa-list"></i>
                                All Users
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="um-search-form">
                            <div className="um-search-wrapper">
                                <i className="fas fa-search um-search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="um-search-input"
                                />
                                <button type="submit" className="um-search-btn">
                                    <i className="fas fa-search"></i>
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="um-error-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="um-loading">
                            <div className="um-spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : (
                        <>
                            {/* Users Table */}
                            <div className="um-table-container">
                                <table className="um-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <i className="fas fa-envelope"></i>
                                                Email
                                            </th>
                                            <th>
                                                <i className="fas fa-user"></i>
                                                First Name
                                            </th>
                                            <th>
                                                <i className="fas fa-user"></i>
                                                Last Name
                                            </th>
                                            <th>
                                                <i className="fas fa-shield-alt"></i>
                                                Role
                                            </th>
                                            <th>
                                                <i className="fas fa-toggle-on"></i>
                                                Status
                                            </th>
                                            <th>
                                                <i className="fas fa-cog"></i>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="um-empty-state">
                                                    <i className="fas fa-inbox"></i>
                                                    <p>No users found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.email} className="um-table-row">
                                                    <td className="um-email">{user.email}</td>
                                                    <td>{user.firstName || '-'}</td>
                                                    <td>{user.lastName || '-'}</td>
                                                    <td>
                                                        <span className={`um-role-badge ${user.role.toLowerCase()}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`um-status-badge ${user.status ? 'active' : 'inactive'}`}>
                                                            <i className={`fas ${user.status ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                                            {user.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="um-action-buttons">
                                                            <LuxuryTooltip content={user.status ? 'Deactivate User' : 'Activate User'}>
                                                                <button
                                                                    className={`um-action-btn ${user.status ? 'deactivate' : 'activate'}`}
                                                                    onClick={() => handleToggleStatus(user.email, user.status)}
                                                                >
                                                                    <i className={`fas ${user.status ? 'fa-ban' : 'fa-check'}`}></i>
                                                                </button>
                                                            </LuxuryTooltip>

                                                            {userRole === 'SUPER_ADMIN' && (
                                                                <LuxuryTooltip content="Change Role">
                                                                    <button
                                                                        className="um-action-btn change-role"
                                                                        onClick={() => openRoleModal(user)}
                                                                    >
                                                                        <i className="fas fa-user-shield"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="um-pagination">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                        className="um-page-btn"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                        Previous
                                    </button>

                                    <div className="um-page-info">
                                        <span className="um-page-current">Page {page + 1}</span>
                                        <span className="um-page-separator">of</span>
                                        <span className="um-page-total">{totalPages}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1}
                                        className="um-page-btn"
                                    >
                                        Next
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
            {/* Role Change Modal */}
            {showRoleModal && (
                <div className="um-modal-overlay">
                    <div className="um-modal">
                        <div className="um-modal-header">
                            <h3>Change University Role</h3>
                            <button className="um-modal-close" onClick={() => setShowRoleModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="um-modal-body">
                            <div className="um-modal-user">
                                User: <strong>{selectedUser?.email}</strong>
                            </div>
                            <div className="um-form-group">
                                <CustomSelect
                                    label="Assign New Role"
                                    options={availableRoles}
                                    value={newRole}
                                    onChange={(val) => setNewRole(val)}
                                    disabled={isSavingRole}
                                    placeholder="Select a role..."
                                    icon="fas fa-shield-alt"
                                />
                            </div>
                        </div>
                        <div className="um-modal-footer">
                            <button 
                                className="um-btn-cancel" 
                                onClick={() => setShowRoleModal(false)}
                                disabled={isSavingRole}
                            >
                                Cancel
                            </button>
                            <button 
                                className="um-btn-save" 
                                onClick={handleSaveRole}
                                disabled={isSavingRole || newRole === selectedUser?.role}
                            >
                                {isSavingRole ? <i className="fas fa-spinner fa-spin"></i> : 'Update Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default UserManagement;
