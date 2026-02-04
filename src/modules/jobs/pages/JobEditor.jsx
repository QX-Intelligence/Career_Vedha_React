import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import './JobEditor.css';
import '../../../styles/Dashboard.css';


const JobEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        organization: '',
        job_type: 'PRIVATE',
        location: '',
        application_start_date: '',
        application_end_date: '',
        exam_date: '',
        job_description: '',
        eligibility: '',
        selection_process: '',
        salary: '',
        vacancies: 0,
        qualification: '',
        experience: '',
        apply_url: '',
        department: '',
        status: 1
    });

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    const userRole = getUserContext().role;

    useEffect(() => {
        if (isEditMode) {
            const fetchJob = async () => {
                try {
                    const job = await jobsService.getAdminJobDetail(id);
                    
                    // Safety checks for date formatting
                    const formatDate = (dateStr) => {
                        if (!dateStr) return '';
                        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                    };

                    setFormData({
                        ...job,
                        application_start_date: formatDate(job.application_start_date),
                        application_end_date: formatDate(job.application_end_date),
                        exam_date: formatDate(job.exam_date),
                        vacancies: job.vacancies || 0
                    });
                } catch (error) {
                    console.error('Error fetching job details:', error);
                    showSnackbar('Failed to load job data', 'error');
                    navigate('/cms/jobs');
                } finally {
                    setLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEditMode, navigate, showSnackbar]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        
        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            
            // Auto-generate slug from title if slug is empty
            if (name === 'title' && !prev.slug) {
                updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final validation
        if (!formData.slug) {
            formData.slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        setSaving(true);
        try {
            if (isEditMode) {
                await jobsService.updateJob(id, formData);
                showSnackbar('Job updated successfully', 'success');
            } else {
                await jobsService.createJob(formData);
                showSnackbar('Job posted successfully', 'success');
            }
            navigate('/cms/jobs');
        } catch (error) {
            const errorMsg = error.response?.data?.error || (isEditMode ? 'Failed to update job' : 'Failed to post job');
            showSnackbar(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/log-out');
            navigate('/admin-login');
        } catch (err) {
            navigate('/admin-login');
        }
    };

    const navigateToGlobalResult = (item) => {
        if (item.section === 'cms/jobs') {
            clearGlobalSearch();
        } else if (item.section === 'user-management') {
            navigate('/user-management');
            clearGlobalSearch();
        } else {
            navigate(`/dashboard?tab=${item.section}`);
            clearGlobalSearch();
        }
    };

    if (loading) return (
        <div className="cms-loading-overlay">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading editor...</p>
        </div>
    );

    const sidebarProps = {
        activeSection: 'jobs',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: () => {
            api.post('/log-out').finally(() => navigate('/admin-login'));
        },
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: isEditMode ? 'Edit Job' : 'Post Job',
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <form className="job-editor-form" onSubmit={handleSubmit}>
                <div className="editor-header">
                    <div className="editor-title-area">
                        <h1>{isEditMode ? 'Edit Job Posting' : 'Post New Job'}</h1>
                        <p>Provide accurate details for candidates</p>
                    </div>
                    <div className="editor-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/cms/jobs')}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update Job' : 'Publish Job'}
                        </button>
                    </div>
                </div>

                <div className="editor-grid">
                    <div className="editor-main-panel glass-card">
                        <section className="form-section">
                            <label>Job Title</label>
                            <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Software Engineer" required />
                        </section>

                        <div className="form-row">
                            <section className="form-section">
                                <label>Organization</label>
                                <input name="organization" value={formData.organization} onChange={handleChange} placeholder="Company name" required />
                            </section>
                            <section className="form-section">
                                <label>Location</label>
                                <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote, Hyderabad" required />
                            </section>
                        </div>

                        <div className="form-row">
                            <section className="form-section">
                                <label>Slug (URL Identifier)</label>
                                <input name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. software-engineer-hyd" required />
                            </section>
                            <section className="form-section">
                                <label>Department</label>
                                <input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. IT, Education" />
                            </section>
                        </div>

                        <section className="form-section">
                            <label>Job Description</label>
                            <textarea name="job_description" value={formData.job_description} onChange={handleChange} placeholder="Detailed role description" rows="8" required />
                        </section>

                        <section className="form-section">
                            <label>Eligibility Criteria</label>
                            <textarea name="eligibility" value={formData.eligibility} onChange={handleChange} placeholder="Who can apply?" rows="4" />
                        </section>

                        <section className="form-section">
                            <label>Selection Process</label>
                            <textarea name="selection_process" value={formData.selection_process} onChange={handleChange} placeholder="How are candidates selected?" rows="4" />
                        </section>

                        <div className="form-row">
                            <section className="form-section">
                                <label>Qualification</label>
                                <input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. B.Tech, Any Degree" />
                            </section>
                            <section className="form-section">
                                <label>Experience</label>
                                <input name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 2-5 years" />
                            </section>
                        </div>
                    </div>

                    <div className="editor-side-panel glass-card">
                        <section className="form-section">
                            <label>Job Type</label>
                            <select name="job_type" value={formData.job_type} onChange={handleChange}>
                                <option value="PRIVATE">Private Sector</option>
                                <option value="GOVT">Government / Public Sector</option>
                            </select>
                        </section>

                        <div className="form-row">
                            <section className="form-section">
                                <label>Salary Range</label>
                                <input name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 5-8 LPA" />
                            </section>
                            <section className="form-section">
                                <label>Vacancies</label>
                                <input type="number" name="vacancies" value={formData.vacancies} onChange={handleChange} />
                            </section>
                        </div>

                        <section className="form-section">
                            <label>Application Link</label>
                            <input name="apply_url" value={formData.apply_url} onChange={handleChange} placeholder="Official application URL" />
                        </section>

                        <section className="form-section">
                            <label>Start Date</label>
                            <input type="date" name="application_start_date" value={formData.application_start_date} onChange={handleChange} />
                        </section>

                        <section className="form-section">
                            <label>End Date (Deadline)</label>
                            <input type="date" name="application_end_date" value={formData.application_end_date} onChange={handleChange} required />
                        </section>

                        <section className="form-section">
                            <label>Exam Date (Optional)</label>
                            <input type="date" name="exam_date" value={formData.exam_date} onChange={handleChange} />
                        </section>

                        <div className="status-toggle-container">
                            <span>Set as Active</span>
                            <label className="switch">
                                <input type="checkbox" name="status" checked={formData.status === 1} onChange={handleChange} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        </CMSLayout>
    );
};

export default JobEditor;
