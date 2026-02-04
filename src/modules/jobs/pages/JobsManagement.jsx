import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import { jobsService } from '../../../services/jobsService';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../../services/notificationService';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getRoleInitials } from '../../../utils/roleUtils';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import API_CONFIG from '../../../config/api.config';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import '../../../styles/ArticleManagement.css';
import './JobsManagement.css';



const JobsManagement = () => {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    const userRole = getUserContext().role;

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Using admin API cms/jobs/list/ which returns { total, results, limit, offset }
            const data = await jobsService.getAdminJobs({ limit: 100 });
            const results = data.results || [];
            
            // DEBUG: Log the first job to see what fields we actually have
            if (results.length > 0) {
                console.log('[JobsManagement] Sample job data:', results[0]);
            }
            
            setJobs(results);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showSnackbar('Failed to fetch jobs', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userRole) {
            fetchJobs();
        }
    }, [userRole]);

    const handleAction = async (jobId, action) => {
        try {
            if (action === 'activate') {
                await jobsService.activateJob(jobId);
                showSnackbar('Job activated successfully', 'success');
            } else if (action === 'deactivate') {
                await jobsService.deactivateJob(jobId);
                showSnackbar('Job deactivated successfully', 'success');
            }
            // Add a small delay to allow backend to process if needed, then fetch
            setTimeout(() => fetchJobs(), 500);
        } catch (error) {
            showSnackbar(`Failed to ${action} job`, 'error');
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

    const filteredJobs = jobs.filter(job => {
        // Simplified status check using backend provided fields
        const isActive = job.status_display?.toUpperCase() === 'ACTIVE' || job.status === 1 || job.is_active || job.isActive;
        const title = job.title || '';
        const org = job.organization || '';
        
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               org.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'ACTIVE') return matchesSearch && isActive;
        if (activeTab === 'INACTIVE') return matchesSearch && !isActive;
        return matchesSearch;
    });

    const navigateToGlobalResult = (item) => {
        if (item.section === 'jobs') {
            clearGlobalSearch();
        } else if (item.section === 'user-management') {
            navigate('/user-management');
            clearGlobalSearch();
        } else {
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    const sidebarProps = {
        activeSection: 'jobs',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "Jobs Management",
        searchQuery: searchQuery,
        handleSearch: (e) => setSearchQuery(e.target.value),
        searchResults: [],
        showSearchResults: false,
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-briefcase"></i>
                        Jobs Management
                    </h1>
                    <p className="am-subtitle">Create, track and manage job postings</p>
                </div>
                <button className="m-btn-primary" onClick={() => navigate('/cms/jobs/new')}>
                    <i className="fas fa-plus"></i> Post New Job
                </button>
            </div>

            <div className="am-filter-bar">
                <div className="am-tabs">
                    <button className={`am-tab ${activeTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('ACTIVE')}>
                        <i className="fas fa-check-circle"></i> Active
                        <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                            {jobs.filter(j => {
                                const isActive = j.status_display?.toUpperCase() === 'ACTIVE' || j.status === 1 || j.is_active || j.isActive;
                                return isActive;
                            }).length}
                        </span>
                    </button>
                    <button className={`am-tab ${activeTab === 'INACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('INACTIVE')}>
                        <i className="fas fa-eye-slash"></i> Inactive
                        <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                            {jobs.filter(j => {
                                const isActive = j.status_display?.toUpperCase() === 'ACTIVE' || j.status === 1 || j.is_active || j.isActive;
                                return !isActive;
                            }).length}
                        </span>
                    </button>
                    <button className={`am-tab ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
                        <i className="fas fa-list"></i> All Jobs
                        <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                            {jobs.length}
                        </span>
                    </button>
                </div>
                <div className="am-search-form">
                    <div className="am-search-wrapper">
                        <i className="fas fa-search am-search-icon"></i>
                        <input 
                            type="text" 
                            placeholder="Search by title or organization..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="am-search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                {loading ? (
                    <div className="am-loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Syncing job records...</p>
                    </div>
                ) : (
                    <div className="am-table-container">
                        <table className="am-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Job Title</th>
                                    <th>Organization</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.map(job => (
                                        <tr key={job.id}>
                                            <td style={{ fontWeight: 'bold', color: 'var(--slate-500)' }}>#{job.id}</td>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>{job.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    <i className="fas fa-link" style={{ fontSize: '0.7rem' }}></i> {job.slug}
                                                </div>
                                            </td>
                                            <td>{job.organization}</td>
                                            <td>
                                                <span className={`am-status-badge ${job.job_type.toLowerCase() === 'govt' ? 'review' : 'draft'}`}>
                                                    {job.job_type}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{job.location || 'N/A'}</td>
                                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(job.application_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <span className={`am-status-badge ${job.status_display?.toLowerCase() || ((job.is_active || job.isActive || job.status === 'ACTIVE') ? 'published' : 'inactive')}`}>
                                                    {job.status_display || ((job.is_active || job.isActive || job.status === 'ACTIVE') ? 'Published' : 'Inactive')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="am-action-buttons" style={{ justifyContent: 'center' }}>
                                                    <LuxuryTooltip content="Edit">
                                                        <button className="am-action-btn am-btn-edit" onClick={() => navigate(`/cms/jobs/edit/${job.id}`)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                    {(job.is_active || job.isActive || job.status === 'ACTIVE' || (job.status_display && job.status_display.toUpperCase() === 'ACTIVE')) ? (
                                                        <LuxuryTooltip content="Deactivate">
                                                            <button className="am-action-btn am-btn-delete" onClick={() => handleAction(job.id, 'deactivate')}>
                                                                <i className="fas fa-eye-slash"></i>
                                                            </button>
                                                        </LuxuryTooltip>
                                                    ) : (
                                                        <LuxuryTooltip content="Activate">
                                                            <button className="am-action-btn am-btn-publish" onClick={() => handleAction(job.id, 'activate')}>
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                        </LuxuryTooltip>
                                                    )}
                                                    <LuxuryTooltip content="View Public Page">
                                                        <button className="am-action-btn am-btn-edit" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fef3c7' }} onClick={() => window.open(`/jobs/${job.slug}`, '_blank')}>
                                                            <i className="fas fa-external-link-alt"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="am-empty-state">
                                            <i className="fas fa-briefcase"></i>
                                            <h3>No jobs found</h3>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </CMSLayout>
    );
};

export default JobsManagement;
