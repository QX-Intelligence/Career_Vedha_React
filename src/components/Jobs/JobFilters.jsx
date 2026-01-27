import React, { useEffect, useState } from 'react';
import { jobsService } from '../../services/jobsService';
import './JobFilters.css';

const JobFilters = ({ filters, onFilterChange }) => {
    const [options, setOptions] = useState({
        job_type_counts: [],
        top_locations: [],
        top_organizations: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const data = await jobsService.getJobFilters();
                setOptions(data);
            } catch (error) {
                console.error("Failed to load filters", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilters();
    }, []);

    const handleCheckboxChange = (group, value) => {
        // If needed to support multiple selection, logic would be more complex
        // For now, assuming single selection or toggle for simplicity based on typically supported API
        // If API supports ?job_type=A,B then we need array. 
        // Based on implementation plan, let's stick to single select for simplicity first or simple toggle.
        
        const currentVal = filters[group];
        // Toggle logic if we want to allow unselecting
        const newVal = currentVal === value ? '' : value;
        onFilterChange(group, newVal);
    };

    if (loading) return <div className="filters-loading">Loading filters...</div>;

    return (
        <div className="job-filters-sidebar">
            <div className="filter-header">
                <h3>Filters</h3>
                <button 
                    className="clear-btn"
                    onClick={() => {
                        onFilterChange('job_type', '');
                        onFilterChange('location', '');
                        onFilterChange('organization', '');
                    }}
                >
                    Clear All
                </button>
            </div>

            {/* Job Type Section */}
            <div className="filter-section">
                <h4>Job Type</h4>
                <div className="filter-options">
                    {options.job_type_counts.map((item) => (
                        <label key={item.job_type} className="custom-checkbox">
                            <input
                                type="checkbox"
                                checked={filters.job_type === item.job_type}
                                onChange={() => handleCheckboxChange('job_type', item.job_type)}
                            />
                            <span className="checkmark"></span>
                            <span className="label-text">
                                {item.job_type === 'GOVT' ? 'Government' : 'Private'}
                            </span>
                            <span className="count-badge">{item.count}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Location Section */}
            {options.top_locations.length > 0 && (
                <div className="filter-section">
                    <h4>Location</h4>
                    <div className="filter-options">
                        {options.top_locations.map((item) => (
                            <label key={item.location} className="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={filters.location === item.location}
                                    onChange={() => handleCheckboxChange('location', item.location)}
                                />
                                <span className="checkmark"></span>
                                <span className="label-text">{item.location}</span>
                                <span className="count-badge">{item.count}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Organization Section */}
            {options.top_organizations.length > 0 && (
                <div className="filter-section">
                    <h4>Organization</h4>
                    <div className="filter-options">
                        {options.top_organizations.map((item) => (
                            <label key={item.organization} className="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={filters.organization === item.organization}
                                    onChange={() => handleCheckboxChange('organization', item.organization)}
                                />
                                <span className="checkmark"></span>
                                <span className="label-text">{item.organization}</span>
                                <span className="count-badge">{item.count}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobFilters;
