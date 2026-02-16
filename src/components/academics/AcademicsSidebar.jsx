import React from 'react';
import { useAcademicsHierarchy } from '../../hooks/useAcademics';
import './AcademicsSidebar.css';

const AcademicsSidebar = ({ activeLevelId, onLevelChange }) => {
    const { data: hierarchy = [], isLoading } = useAcademicsHierarchy();

    if (isLoading) return (
        <div className="academics-sidebar loading-state">
            <div className="shimmer-wrapper">
                <div className="shimmer-item title"></div>
                <div className="shimmer-item list"></div>
                <div className="shimmer-item list"></div>
                <div className="shimmer-item list"></div>
            </div>
        </div>
    );

    return (
        <div className="academics-sidebar premium-glass">
            <div className="sidebar-brand-header">
                <div className="brand-title">
                    <i className="fas fa-graduation-cap-alt icon-main"></i>
                    <h3>Academics</h3>
                </div>
                <button 
                    className="premium-reset-btn"
                    onClick={() => onLevelChange(null)}
                    title="Clear filters"
                >
                    <i className="fas fa-undo-alt"></i>
                    <span>Reset</span>
                </button>
            </div>

            <div className="luxury-filter-container">
                <div className="section-title-box">
                    <i className="fas fa-layer-group icon-section"></i>
                    <span className="section-label">Select Level / Class</span>
                </div>
                
                <div className="luxury-options-list">
                    {hierarchy.map((level) => (
                        <div 
                            key={level.id} 
                            className={`luxury-option-item ${activeLevelId === level.id ? 'active' : ''}`}
                            onClick={() => onLevelChange(activeLevelId === level.id ? null : level.id)}
                        >
                            <div className="selection-indicator">
                                <div className="indicator-inner"></div>
                            </div>
                            <span className="option-label">{level.name}</span>
                            <div className="stats-pill">
                                <span className="count-num">{level.subjects?.length || 0}</span>
                                <span className="count-text">Subs</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="luxury-info-banner">
                <div className="banner-glow"></div>
                <div className="banner-content">
                    <i className="fas fa-sparkles banner-icon"></i>
                    <p>Select a class to explore curated subjects and chapters personalized for you.</p>
                </div>
            </div>
        </div>
    );
};

export default AcademicsSidebar;
