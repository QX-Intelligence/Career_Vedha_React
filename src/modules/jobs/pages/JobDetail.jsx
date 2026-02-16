import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { jobsService } from '../../../services/jobsService';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import './JobDetail.css';

const JobDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [seo, setSeo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await jobsService.getJobDetail(slug);
                setJob(data);
                
                // Track view event
                // jobsService.trackView(slug); // If implemented
            } catch (err) {
                console.error('Error loading job detail:', err);
                setError(err.response?.status === 410 ? 'GONE' : 'NOT_FOUND');
            } finally {
                setLoading(false);
            }
        };

        const fetchSEO = async () => {
            try {
                const seoData = await jobsService.getJobSEO(slug);
                if (seoData) setSeo(seoData);
            } catch (err) {
                console.error("SEO fetch error", err);
            }
        };

        fetchJob();
        fetchSEO();
    }, [slug]);

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    if (loading) {
        return (
            <div className="job-detail-loading">
                <div className="premium-loader"></div>
                <p>Curating Best Career Paths for You...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="job-detail-error">
                <div className="error-card">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h2>{error === 'GONE' ? 'Job No Longer Available' : 'Job Not Found'}</h2>
                    <p>
                        {error === 'GONE' 
                          ? 'This job posting has expired or was removed by the publisher.' 
                          : 'The job you are looking for does not exist or has been moved.'}
                    </p>
                    <button onClick={() => navigate('/jobs')} className="btn-back">
                        Explore Other Jobs
                    </button>
                </div>
            </div>
        );
    }

    const {
        title, organization, department, location, job_type, 
        application_end_date, job_description, eligibility,
        selection_process, salary, vacancies, qualification,
        experience, apply_url, views_count, created_at, status_display
    } = job;

    return (
        <div className="job-detail-page">
            <Helmet>
                <title>{seo?.title || `${title} | Career Vedha`}</title>
                <meta name="description" content={seo?.description || job_description?.substring(0, 160)} />
                <link rel="canonical" href={seo?.canonical || window.location.href} />
                {seo?.schema && (
                    <script type="application/ld+json">
                        {JSON.stringify(seo.schema)}
                    </script>
                )}
            </Helmet>
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <main className="job-detail-container">
                <div className="container">
                    <div className="job-detail-header">
                        <div className="header-main-info">
                        <div className="type-badge-container">
                                <span className={`job-type-badge ${job_type === 'GOVT' ? 'govt' : 'private'}`}>
                                    {job_type} JOB
                                </span>
                                {status_display && (
                                    <span className={`job-status-badge-detail ${status_display.toLowerCase()}`}>
                                        {status_display}
                                    </span>
                                )}
                            </div>
                            <h1>{title}</h1>
                            <div className="org-department">
                                <span className="org-name">{organization}</span>
                                {department && <span className="dept-name">• {department}</span>}
                            </div>
                        </div>

                        <div className="header-actions">
                            <div className="views-info">
                                <i className="fas fa-eye"></i> {views_count} views
                            </div>
                            <div className="apply-btn-wrapper-header">
                                <a href={apply_url} target="_blank" rel="noopener noreferrer" className="btn-apply-direct premium-pulse">
                                    Apply Now <i className="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="job-detail-grid">
                        <div className="job-main-column">
                            <section className="detail-section glass-card">
                                <h3><i className="fas fa-info-circle"></i> Job Description</h3>
                                <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: job_description }} />
                            </section>

                            {eligibility && (
                                <section className="detail-section glass-card">
                                    <h3><i className="fas fa-user-check"></i> Eligibility Criteria</h3>
                                    <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: eligibility }} />
                                </section>
                            )}

                            {selection_process && (
                                <section className="detail-section glass-card">
                                    <h3><i className="fas fa-clipboard-list"></i> Selection Process</h3>
                                    <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: selection_process }} />
                                </section>
                            )}
                        </div>

                        <aside className="job-side-column">
                            <div className="quick-info-card glass-card">
                                <h3>Job Overview</h3>
                                <div className="info-item">
                                    <div className="info-label">Location</div>
                                    <div className="info-value">{location || 'Multiple Locations'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Salary</div>
                                    <div className="info-value">{salary || 'As per norms'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Vacancies</div>
                                    <div className="info-value">{vacancies || 'Multiple'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Experience</div>
                                    <div className="info-value">{experience || 'Freshers / Experienced'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Qualification</div>
                                    <div className="info-value">{qualification || 'Any Graduate'}</div>
                                </div>
                                
                                <div className="deadline-timer">
                                    <div className="info-label">Application Ends On</div>
                                    <div className="deadline-val">
                                        {new Date(application_end_date).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="share-card glass-card">
                                <h3>Spread the Word</h3>
                                <div className="share-buttons">
                                    <button className="share-btn whatsapp"><i className="fab fa-whatsapp"></i></button>
                                    <button className="share-btn telegram"><i className="fab fa-telegram-plane"></i></button>
                                    <button className="share-btn twitter"><i className="fab fa-twitter"></i></button>
                                    <button className="share-btn link"><i className="fas fa-link"></i></button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default JobDetail;
