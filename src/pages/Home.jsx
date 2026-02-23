import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useHomeContent } from '../hooks/useHomeContent';
import { getTranslations } from '../utils/translations';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import QuickAccess from '../components/home/QuickAccess';
import FeaturedStory from '../components/home/FeaturedStory';
import Sidebar from '../components/home/Sidebar';
import LatestArticles from '../components/home/LatestArticles';
import SectionCategoryBlocks from '../components/home/SectionCategoryBlocks';
import HeroIntro from '../components/home/HeroIntro';
import MustRead from '../components/home/MustRead';
import Skeleton from '../components/ui/Skeleton';

// Lazy load below-the-fold components
const ExploreMore = lazy(() => import('../components/home/ExploreMore'));
const PreviousPapers = lazy(() => import('../components/home/PreviousPapers'));
const MultiWidgets = lazy(() => import('../components/home/MultiWidgets'));
const Shorts = lazy(() => import('../components/home/Shorts'));
const LongVideos = lazy(() => import('../components/home/LongVideos'));

// Loading Placeholder for Lazy Components
const SectionSkeleton = () => (
    <div className="container" style={{ padding: '2rem 0' }}>
        <Skeleton variant="title" width="30%" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Skeleton variant="card" count={3} />
        </div>
    </div>
);

const Home = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    const { data: homeData = {
        hero: [],
        breaking: [],
        top_stories: [],
        latest: { results: [], has_next: false }
    }, isLoading: loading } = useHomeContent(activeLanguage, 6);

    const t = useMemo(() => getTranslations(activeLanguage), [activeLanguage]);

    const handleLanguageChange = useCallback((lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    }, []);

    return (
        <div className="home-page">
            {/* These components handle their own desktop-only visibility via CSS media queries in MobileLayout/index.css */}
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />
            
            <MustRead 
                activeLanguage={activeLanguage} 
                articles={homeData.must_read || []}
                loading={loading}
            />
            <div className="responsive-hero-section">
                <HeroIntro />
            </div>
            <QuickAccess activeLanguage={activeLanguage} />

            <div className="latest-updates-header container">
                <div className="section-marker"></div>
                <h2>{t.latestUpdates}</h2>
                <Link to="/articles" className="see-all-btn">{t.seeAll} <i className="fas fa-chevron-right"></i></Link>
            </div>

            <main className="main-content">
                <div className="container">
                    <div className="content-layout">
                        <div className="main-story-section">
                            <div className="updates-grid-layout">
                                <FeaturedStory
                                    story={homeData.hero?.[0]}
                                    loading={loading}
                                    activeLanguage={activeLanguage}
                                />
                            </div>
                            
                            <div className="latest-articles-full-width">
                                <LatestArticles
                                    latest={homeData.latest}
                                    loading={loading}
                                    activeLanguage={activeLanguage}
                                />
                            </div>
                        </div>
                        <div className="sidebar-container desktop-only">
                            <Sidebar activeLanguage={activeLanguage} />
                        </div>
                    </div>
                </div>
            </main>



            <SectionCategoryBlocks section="academics" title={t.latestFromAcademics} activeLanguage={activeLanguage} />
            <SectionCategoryBlocks section="jobs" title={t.careerOpportunities} activeLanguage={activeLanguage} />

            {/* <Suspense fallback={<SectionSkeleton />}>
                <ExploreMore activeLanguage={activeLanguage} />
            </Suspense> */}
            
            <Suspense fallback={<SectionSkeleton />}>
                <PreviousPapers activeLanguage={activeLanguage} />
            </Suspense>
            
            {/* <Suspense fallback={<SectionSkeleton />}>
                <MultiWidgets activeLanguage={activeLanguage} />
            </Suspense> */}
            
            <Suspense fallback={<SectionSkeleton />}>
                <LongVideos activeLanguage={activeLanguage} />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <Shorts activeLanguage={activeLanguage} />
            </Suspense>
            
            <Footer />
        </div>
    );
};

export default Home;

