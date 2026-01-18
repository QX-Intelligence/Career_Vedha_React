import React, { useState } from 'react';
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
import PreviousPapers from '../components/home/PreviousPapers';
import MultiWidgets from '../components/home/MultiWidgets';
import Shorts from '../components/home/Shorts';

const Home = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />
            {/* <SecondaryNav /> */}
            <BreakingNews />
            <QuickAccess />

            <main className="main-content">
                <div className="container">
                    <div className="content-layout">
                        <div className="main-story-section">
                            <FeaturedStory />
                            <SecondaryStories />
                        </div>
                        <Sidebar />
                    </div>
                </div>
            </main>

            <ExploreMore />
            <PreviousPapers />
            <MultiWidgets />
            <Shorts />
            <Footer />
        </>
    );
};

export default Home;
