import React, { useState, useEffect, useCallback } from 'react';
import { jobsService } from '../../../services/jobsService';
import api, { getUserContext } from '../../../services/api';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import JobCard from '../components/JobCard';
import JobFilters from '../components/JobFilters';
import './JobsList.css';

const JobsList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        job_type: '',
        location: '',
        organization: ''
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });

    const userContext = getUserContext();
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'].includes(userContext?.role);

    const fetchJobs = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const params = {
                limit: 12,
                cursor: isLoadMore ? cursor : null,
            };

            // Only add filters if they have values to avoid 500 error from backend with empty strings
            if (filters.job_type) params.job_type = filters.job_type;
            if (filters.location) params.location = filters.location;
            if (filters.organization) params.organization = filters.organization;

            const data = await jobsService.getPublicJobs(params);
            
            if (isLoadMore) {
                setJobs(prev => [...prev, ...data.results]);
            } else {
                setJobs(data.results);
            }
            
            // Backend returns has_next and next_cursor
            setHasNext(data.has_next);
            setCursor(data.next_cursor);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filters, cursor]);

    useEffect(() => {
        fetchJobs();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCursor(null); // Reset pagination on filter change
    };

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    return (
        <div className="jobs-page-wrapper">
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="jobs-hero">
                <div className="container">
                    <h1>Explore Career Opportunities</h1>
                    <p>Find the perfect job that matches your skills and aspirations.</p>
                </div>
            </div>

            <main className="jobs-main-content">
                <div className="container mobile-container">
                    <div className="jobs-layout mobile-stack">
                        <aside className="jobs-sidebar desktop-only">
                            <JobFilters 
                                filters={filters} 
                                onFilterChange={handleFilterChange} 
                            />
                        </aside>

                        <div className="jobs-content-area">
                            <div className="jobs-results-header mobile-header-row">
                                <div className="results-title-group">
                                    <h2>Latest Job Openings</h2>
                                    <span className="results-count">
                                        {jobs.length > 0 ? `Showing ${jobs.length} jobs` : 'No jobs found'}
                                    </span>
                                </div>
                                
                            </div>

                            {loading && !loadingMore ? (
                                <div className="jobs-loading-grid">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="job-card-skeleton"></div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="jobs-grid mobile-single-col">
                                        {jobs.length > 0 ? (
                                            jobs.map(job => (
                                                <JobCard key={job.id} job={job} />
                                            ))
                                        ) : (
                                            <div className="no-results-state">
                                                <i className="fas fa-search"></i>
                                                <h3>No jobs found matching your criteria</h3>
                                                <p>Try adjusting your filters or search query.</p>
                                                <button 
                                                    className="btn-reset"
                                                    onClick={() => setFilters({job_type: '', location: '', organization: ''})}
                                                >
                                                    Clear All Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {hasNext && (
                                        <div className="load-more-container">
                                            <button 
                                                className={`btn-load-more touch-target ${loadingMore ? 'loading' : ''}`}
                                                onClick={() => fetchJobs(true)}
                                                disabled={loadingMore}
                                            >
                                                {loadingMore ? 'Loading...' : 'Load More Jobs'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default JobsList;
