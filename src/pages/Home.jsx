import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyLoading';
import { Link } from 'react-router-dom';
import { useHomeContent } from '../hooks/useHomeContent';
import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services';
import { getTranslations } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import QuickAccess from '../components/home/QuickAccess';
import FeaturedStory from '../components/home/FeaturedStory';
import Sidebar from '../components/home/Sidebar';
import LatestArticles from '../components/home/LatestArticles';
import SectionCategoryBlocks from '../components/home/SectionCategoryBlocks';
import TopStoriesHero from '../components/home/TopStoriesHero';
import MustRead from '../components/home/MustRead';
import Skeleton from '../components/ui/Skeleton';

// Lazy load below-the-fold components
const ExploreMore = lazyWithRetry(() => import('../components/home/ExploreMore'));
const PreviousPapers = lazyWithRetry(() => import('../components/home/PreviousPapers'));
const MultiWidgets = lazyWithRetry(() => import('../components/home/MultiWidgets'));
const Shorts = lazyWithRetry(() => import('../components/home/Shorts'));
const LongVideos = lazyWithRetry(() => import('../components/home/LongVideos'));

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
    const { activeLanguage } = useLanguage();
    const { data: homeData = {
        hero: [],
        breaking: [],
        top_stories: [],
    }, isLoading: loading } = useHomeContent(activeLanguage, 6);

    const { data: currentAffairsData, isLoading: caLoading } = useQuery({
        queryKey: ['home-current-affairs', activeLanguage],
        queryFn: () => newsService.getCurrentAffairs({ 
            lang: activeLanguage, 
            limit: 12 
        })
    });

    const t = useMemo(() => getTranslations(activeLanguage), [activeLanguage]);

    return (
        <div className="home-page">
            {/* These components handle their own desktop-only visibility via CSS media queries in MobileLayout/index.css */}
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />
            
            <MustRead 
                activeLanguage={activeLanguage} 
                articles={homeData.must_read || []}
                loading={loading}
            />
            <div className="responsive-hero-section">
                <TopStoriesHero 
                    topStories={homeData.top_stories} 
                    latestUpdates={homeData.latest?.results || currentAffairsData?.results?.slice(0, 5)} 
                    loading={loading}
                    activeLanguage={activeLanguage}
                    isHomePage={true}
                />
            </div>

            <div className="latest-updates-header container">
                <div className="section-marker"></div>
                <h2>{t.navCurrentAffairs}</h2>
                <Link to="/current-affairs" className="see-all-btn">{t.seeAll} <i className="fas fa-chevron-right"></i></Link>
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
                                    latest={currentAffairsData}
                                    loading={caLoading}
                                    activeLanguage={activeLanguage}
                                    hidePagination={true}
                                />
                                
                            </div>
                        </div>
                        <div className="sidebar-container desktop-only">
                            <Sidebar activeLanguage={activeLanguage} />
                        </div>
                    </div>
                    <QuickAccess activeLanguage={activeLanguage} />
                </div>
            </main>



            <SectionCategoryBlocks section="academics" title={t.latestFromAcademics} activeLanguage={activeLanguage} />
            <SectionCategoryBlocks section="jobs" title={t.careerOpportunities} activeLanguage={activeLanguage} />

            {/* Hiding Explore More, Resources, and Videos as requested */}
            {/* <Suspense fallback={<SectionSkeleton />}>
                <ExploreMore activeLanguage={activeLanguage} />
            </Suspense>
            
            <Suspense fallback={<SectionSkeleton />}>
                <PreviousPapers activeLanguage={activeLanguage} />
            </Suspense> */}
            
            {/* <Suspense fallback={<SectionSkeleton />}>
                <MultiWidgets activeLanguage={activeLanguage} />
            </Suspense> */}
            
            {/* <section className="home-videos-wrapper bg-white py-5">
                <div className="container">
                    <div className="section-header-branded mb-5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 className="text-dark" style={{ fontSize: '32px', fontWeight: 800, paddingLeft: 0, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Videos</h2>
                        <div style={{ width: '80px', height: '6px', background: 'linear-gradient(90deg, var(--cv-primary), var(--cv-primary-dark))', borderRadius: '4px', marginBottom: '16px' }}></div>
                        <p className="section-subtitle text-muted text-center m-0" style={{ maxWidth: '600px' }}>Watch the latest updates and insights from Career Vedha</p>
                    </div>
                    
                    <Suspense fallback={<SectionSkeleton />}>
                        <LongVideos activeLanguage={activeLanguage} />
                    </Suspense>

                    <Suspense fallback={<SectionSkeleton />}>
                        <Shorts activeLanguage={activeLanguage} />
                    </Suspense>
                </div>
            </section> */}
            
            
            <Footer />
        </div>
    );
};

export default Home;

