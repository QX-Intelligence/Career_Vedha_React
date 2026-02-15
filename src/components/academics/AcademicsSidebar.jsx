import React from 'react';
import { useAcademicsHierarchy } from '../../hooks/useAcademics';
import './AcademicsSidebar.css';

const AcademicsSidebar = ({ activeLevelId, onLevelChange }) => {
    const { data: hierarchy = [], isLoading } = useAcademicsHierarchy();

    if (isLoading) return <div className="filters-loading">Loading levels...</div>;

    return (
        <div className="job-filters-sidebar academics-sidebar">
            <div className="filter-header">
                <h3>Academics</h3>
                <button 
                    className="clear-btn"
                    onClick={() => onLevelChange(null)}
                >
                    Reset
                </button>
            </div>

            <div className="filter-section">
                <h4>Select Level / Class</h4>
                <div className="filter-options">
                    {hierarchy.map((level) => (
                        <label key={level.id} className="custom-checkbox">
                            <input
                                type="checkbox"
                                checked={activeLevelId === level.id}
                                onChange={() => onLevelChange(activeLevelId === level.id ? null : level.id)}
                            />
                            <span className="checkmark"></span>
                            <span className="label-text">{level.name}</span>
                            <span className="count-badge">{level.subjects?.length || 0}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="sidebar-info-card">
                <i className="fas fa-info-circle"></i>
                <p>Select a class to explore subjects and chapters specifically for that level.</p>
            </div>
        </div>
    );
};

export default AcademicsSidebar;
