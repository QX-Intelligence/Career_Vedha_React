import React, { useState, useEffect } from 'react';
import { newsService } from '../services';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
// import SecondaryNav from '../components/layout/SecondaryNav';
import Footer from '../components/layout/Footer';
import BreakingNews from '../components/home/BreakingNews'; // Keep for safety or remove if unused, but I'll keeping imports for now to avoid breaking other things if I reference them. actually I removed BreakingNews from JSX.
import QuickAccess from '../components/home/QuickAccess';
import FeaturedStory from '../components/home/FeaturedStory';
import SecondaryStories from '../components/home/SecondaryStories';
import Sidebar from '../components/home/Sidebar';
import ExploreMore from '../components/home/ExploreMore';
import LatestArticles from '../components/home/LatestArticles';
import SectionCategoryBlocks from '../components/home/SectionCategoryBlocks';
import PreviousPapers from '../components/home/PreviousPapers';
import MultiWidgets from '../components/home/MultiWidgets';
import Shorts from '../components/home/Shorts';
import QuickLinks from '../components/home/QuickLinks';
import MustRead from '../components/home/MustRead';
import HeroIntro from '../components/home/HeroIntro';
import AcademicsHighlights from '../components/home/AcademicsHighlights';
import { filterPublishedArticles } from '../utils/articleUtils';

const Home = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });
    const [homeData, setHomeData] = useState({
        hero: [],
        breaking: [],
        top_stories: [],
        latest: { results: [], has_next: false }
    });
    const [loading, setLoading] = useState(true);

    const fetchHomeData = async (lang = 'te') => {
        setLoading(true);
        try {
            const data = await newsService.getHomeContent(lang);
            console.log('[Home] Raw Data:', data);
            
            // Filter out scheduled articles (published_at > now)
            const filteredData = {
                hero: filterPublishedArticles(data.hero || []),
                breaking: filterPublishedArticles(data.breaking || []),
                top_stories: filterPublishedArticles(data.top_stories || []),
                featured: filterPublishedArticles(data.featured || []),
                trending: filterPublishedArticles(data.trending || []),
                latest: {
                    ...data.latest,
                    results: filterPublishedArticles(data.latest?.results || [])
                }
            };
            console.log('[Home] Filtered Data:', filteredData);
            
            setHomeData(filteredData);
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
        fetchHomeData(langCode);
    }, [activeLanguage]);

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

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
            
            <MustRead />
            <div className="responsive-hero-section">
                <HeroIntro />
            </div>
            <QuickAccess />

            <div className="latest-updates-header container">
                <div className="section-marker"></div>
                <h2>Latest Updates</h2>
                <a href="/archive" className="see-all-btn">See All <i className="fas fa-chevron-right"></i></a>
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
                            <Sidebar />
                        </div>
                    </div>
                </div>
            </main>

            <AcademicsHighlights />

            <SectionCategoryBlocks section="academics" title="Latest from Academics" />
            <SectionCategoryBlocks section="jobs" title="Career Opportunities" />

            <ExploreMore />
            <PreviousPapers />
            <MultiWidgets />
            <Shorts />
            <Footer />
        </div>
    );
};

export default Home;
