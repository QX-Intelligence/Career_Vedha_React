import React from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import './JobCard.css';

const JobCard = ({ job }) => {
    const navigate = useNavigate();

    const handleApply = (e) => {
        e.stopPropagation();
        navigate(`/jobs/${job.slug}`);
    };

    const isGovt = job.job_type === 'GOVT';
    const isPrivate = job.job_type === 'PRIVATE';

    return (
        <div className="job-card" onClick={() => navigate(`/jobs/${job.slug}`)}>
            <div className="job-card-header">
                <div className="badge-group">
                    <div className={`job-type-badge ${isGovt ? 'govt' : 'private'}`}>
                        {isGovt ? 'Government' : 'Private'}
                    </div>
                    {job.status_display && (
                        <div className={`job-status-badge ${job.status_display.toLowerCase()}`}>
                            {job.status_display}
                        </div>
                    )}
                </div>
                <div className="job-date">
                    <i className="far fa-clock"></i>
                    {new Date(job.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="job-card-body">
                <LuxuryTooltip content={job.title}>
                    <h3 className="job-title">{job.title}</h3>
                </LuxuryTooltip>
                <div className="job-company">
                    <i className="fas fa-building"></i>
                    {job.organization}
                    {job.department && <span className="dept-sep">• {job.department}</span>}
                </div>

                <div className="job-details-grid">
                    <div className="job-detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{job.location || 'Pan India'}</span>
                    </div>
                    <div className="job-detail-item">
                        <i className="fas fa-briefcase"></i>
                        <span>{job.vacancies > 0 ? `${job.vacancies} Vacancies` : 'Multiple Openings'}</span>
                    </div>
                </div>

                {job.salary && (
                    <div className="job-salary">
                        <i className="fas fa-wallet"></i>
                        {job.salary}
                    </div>
                )}
            </div>

            <div className="job-card-footer">
                <div className="deadline-info">
                    <span className="deadline-label">APPLY BY:</span>
                    <span className="deadline-date">
                        {new Date(job.application_end_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                </div>
                <button className="btn-apply-card" onClick={handleApply}>
                    View Details <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

export default JobCard;
