import React, { useState, useEffect } from 'react';
import { newsService } from '../services';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
// import SecondaryNav from '../components/layout/SecondaryNav';
import Footer from '../components/layout/Footer';
import BreakingNews from '../components/home/BreakingNews';
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
            setHomeData(data);
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
        <>
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />
            {/* <SecondaryNav /> */}
            <BreakingNews data={homeData.breaking} />
            <QuickAccess />

            <main className="main-content">
                <div className="container">
                    <div className="content-layout">
                        <div className="main-story-section">
                            <FeaturedStory
                                story={homeData.hero?.[0]}
                                loading={loading}
                                activeLanguage={activeLanguage}
                            />
                            <SecondaryStories
                                stories={homeData.top_stories}
                                loading={loading}
                                activeLanguage={activeLanguage}
                            />
                            <LatestArticles
                                latest={homeData.latest}
                                loading={loading}
                                activeLanguage={activeLanguage}
                            />
                        </div>
                        <Sidebar />
                    </div>
                </div>
            </main>

            <SectionCategoryBlocks section="academics" title="Academic Excellence" />
            <SectionCategoryBlocks section="jobs" title="Career Opportunities" />

            <ExploreMore />
            <PreviousPapers />
            <MultiWidgets />
            <Shorts />
            <Footer />
        </>
    );
};

export default Home;
