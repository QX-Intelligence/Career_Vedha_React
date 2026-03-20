import React, { useState, useEffect, lazy, Suspense } from 'react';
import StudentAcademicsExplorer from '../components/home/StudentAcademicsExplorer';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import AcademicsSidebar from '../components/academics/AcademicsSidebar';
import SectionCategoryBlocks from '../components/home/SectionCategoryBlocks';
import { useAcademicsHierarchy } from '../hooks/useAcademics';
import Skeleton from '../components/ui/Skeleton';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import { useInfiniteArticles } from '../hooks/useArticles';
import './Articles.css';

// Lazy load heavier components
const PreviousPapers = lazy(() => import('../components/home/PreviousPapers'));

const SectionSkeleton = () => (
    <div className="container" style={{ padding: '2rem 0' }}>
        <Skeleton variant="title" width="30%" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Skeleton variant="card" count={3} />
        </div>
    </div>
);

const AcademicExamsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    
    // Derived from URL
    const levelIdParam = searchParams.get('category') || searchParams.get('level');
    const [selectedLevelName, setSelectedLevelName] = useState(null);

    const handleLevelChange = (level) => {
        const newParams = new URLSearchParams(searchParams);
        if (level && level.id) {
            newParams.set('category', level.id);
            setSelectedLevelName(level.name);
            newParams.delete('level');
            newParams.delete('subject');
        } else {
            newParams.delete('category');
            newParams.delete('level');
            newParams.delete('subject');
            setSelectedLevelName(null);
        }
        setSearchParams(newParams);
    };

    const query = selectedLevelName ? `${selectedLevelName} - AP` : '';
    
    // Resolve level name from hierarchy if we have a param but no name
    const { data: hierarchy } = useAcademicsHierarchy();
    useEffect(() => {
        if (levelIdParam && !selectedLevelName && hierarchy) {
            const level = hierarchy.find(l => l.id.toString() === levelIdParam.toString());
            if (level) setSelectedLevelName(level.name);
        }
    }, [levelIdParam, selectedLevelName, hierarchy]);

    // Using unified infinite articles hook with keyword search
    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isLoading, 
        isError 
    } = useInfiniteArticles(query ? { q: query, limit: 200 } : {}, { enabled: !!query });

    const articles = data?.pages.flatMap(page => page.results) || [];

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };
    
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="jobs-page-wrapper">
            <Helmet>
                <title>Academic Exams | Career Vedha</title>
                <meta name="description" content="Explore academic exams, subjects, and chapters. Take practice tests and improve your skills." />
            </Helmet>

            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <TaxonomyTabs sectionSlug="exams" />
            
            <main className="jobs-main-content">
                <div className="container">
                    <div className="jobs-layout">
                        <aside className="jobs-sidebar">
                            <AcademicsSidebar 
                                activeLevelId={levelIdParam} 
                                onLevelChange={handleLevelChange} 
                            />
                        </aside>
                        
                        <div className="jobs-content-area">
                            {levelIdParam ? (
                                <div className="academics-articles-list">
                                    <div className="section-header-flex">
                                        <h2 className="premium-title">{selectedLevelName || 'Academic Materials'}</h2>
                                        <div className="papers-count">{articles.length} Materials Found</div>
                                    </div>

                                    {isLoading ? (
                                        <div className="premium-loader-container">
                                            <div className="premium-spinner"></div>
                                            <p>Fetching amazing content for you...</p>
                                        </div>
                                    ) : articles.length > 0 ? (
                                        <div className="papers-grid-large">
                                            {articles.map(article => (
                                                <Link 
                                                    key={article.id} 
                                                    to={`/articles/${article.slug}`} 
                                                    className="paper-card-large"
                                                >
                                                    <div className="paper-icon">
                                                        <i className="fas fa-file-pdf"></i>
                                                    </div>
                                                    <div className="paper-card-content">
                                                        <h3 className="paper-title">{article.title}</h3>
                                                        <p className="paper-description">{article.summary}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="papers-empty">
                                            <i className="fas fa-search"></i>
                                            <p>No academic materials found for this level matching "{query}".</p>
                                        </div>
                                    )}

                                    {hasNextPage && (
                                        <div className="load-more-container">
                                            <button className="load-more-btn" onClick={() => fetchNextPage()}>
                                                <i className="fas fa-plus"></i> Load More
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <StudentAcademicsExplorer 
                                    showHeader={false} 
                                    style={{ padding: '0', background: 'transparent' }} 
                                    activeLevelId={levelIdParam}
                                    activeLanguage={activeLanguage}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Academics-related resources from Home */}
            <SectionCategoryBlocks section="academics" title="Latest from Academics" activeLanguage={activeLanguage} />

            <Suspense fallback={<SectionSkeleton />}>
                <PreviousPapers activeLanguage={activeLanguage} title="Previous Question Papers" />
            </Suspense>

            <Footer />
        </div>
    );
};

export default AcademicExamsPage;
