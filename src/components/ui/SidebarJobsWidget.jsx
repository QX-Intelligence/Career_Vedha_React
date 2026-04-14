import React, { useState, useEffect } from 'react';
import { jobsService } from '../../services/jobsService';
import { Link } from 'react-router-dom';
import './SidebarJobsWidget.css';

const SidebarJobsWidget = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobsService.getPublicJobs({ limit: 4 });
                setJobs(data.results || []);
            } catch (error) {
                console.error("Error fetching sidebar jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading || jobs.length === 0) return null;

    return (
        <div className="sidebar-widget jobs-widget section-fade-in mt-4">
            <h3 className="widget-title">
                <i className="fas fa-briefcase" style={{ color: 'var(--cv-primary)', marginRight: '8px' }}></i>
                Career Opportunities
            </h3>
            <div className="sidebar-compact-list">
                {jobs.map((job) => (
                    <Link to={`/jobs/${job.slug || job.id}`} key={job.id} className="sidebar-compact-item">
                        <div className="compact-thumb">
                            <div className="job-initials">
                                {job.organization?.charAt(0) || 'J'}
                            </div>
                        </div>
                        <div className="compact-info">
                            <h4 className="compact-item-title">{job.title}</h4>
                            <span className="compact-item-meta">
                                {job.organization} • {job.location}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <Link to="/jobs" className="widget-view-all">
                View All Careers <i className="fas fa-chevron-right"></i>
            </Link>
        </div>
    );
};

export default SidebarJobsWidget;
