import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import { getUserContext } from '../../../services/api'; // api import removed if not needed directly
import { useSnackbar } from '../../../context/SnackbarContext';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import '../../../styles/ArticleManagement.css'; // Accessing styles from ArticleManagement
import './JobsManagement.css';
import { useAdminJobs, useActivateJob, useDeactivateJob } from '../../../hooks/useJobs';

const JobsManagement = () => {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    
    // Local state for UI filters
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const { role: userRole, isAuthenticated } = getUserContext();

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'];
        if (!isAuthenticated || !allowedRoles.includes(userRole)) {
            navigate('/admin-login');
        }
    }, [isAuthenticated, userRole, navigate]);

    // --- React Query Hooks ---
    const { 
        data: jobs = [], 
        isLoading: loading, 
        error 
    } = useAdminJobs({ limit: 100 });

    const activateMutation = useActivateJob();
    const deactivateMutation = useDeactivateJob();

    // Handle mutations
    const handleAction = async (jobId, action) => {
        const mutation = action === 'activate' ? activateMutation : deactivateMutation;
        
        mutation.mutate(jobId, {
            onSuccess: () => {
                showSnackbar(`Job ${action}d successfully`, 'success');
            },
            onError: () => {
                showSnackbar(`Failed to ${action} job`, 'error');
            }
        });
    };

    const handleLogout = async () => {
        // Assuming logout logic is handled by global auth or just redirect
        navigate('/admin-login');
    };

    // --- Filtering Logic ---
    const filteredJobs = jobs.filter(job => {
        // Simplified status check using backend provided fields or fallbacks
        const isActive = job.status_display?.toUpperCase() === 'ACTIVE' || job.status === 1 || job.is_active || job.isActive;
        const title = job.title || '';
        const org = job.organization || '';
        
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               org.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'ACTIVE') return matchesSearch && isActive;
        if (activeTab === 'INACTIVE') return matchesSearch && !isActive;
        return matchesSearch;
    });

    const activeCount = jobs.filter(j => 
        j.status_display?.toUpperCase() === 'ACTIVE' || j.status === 1 || j.is_active || j.isActive
    ).length;
    
    const inactiveCount = jobs.length - activeCount;

    // --- CMS Layout Props ---
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

    if (error) {
        // Optional: Render error state nicer
        console.error("Jobs fetch error:", error);
    }

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
                            {activeCount}
                        </span>
                    </button>
                    <button className={`am-tab ${activeTab === 'INACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('INACTIVE')}>
                        <i className="fas fa-eye-slash"></i> Inactive
                        <span style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '4px' }}>
                            {inactiveCount}
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
                                                            <button 
                                                                className="am-action-btn am-btn-delete" 
                                                                onClick={() => handleAction(job.id, 'deactivate')}
                                                                disabled={deactivateMutation.isPending}
                                                            >
                                                                {deactivateMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye-slash"></i>}
                                                            </button>
                                                        </LuxuryTooltip>
                                                    ) : (
                                                        <LuxuryTooltip content="Activate">
                                                            <button 
                                                                className="am-action-btn am-btn-publish" 
                                                                onClick={() => handleAction(job.id, 'activate')}
                                                                disabled={activateMutation.isPending}
                                                            >
                                                                {activateMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye"></i>}
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
