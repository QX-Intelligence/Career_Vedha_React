import React, { useState, useEffect } from 'react';
import StudentAcademicsExplorer from '../components/home/StudentAcademicsExplorer';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import AcademicsSidebar from '../components/academics/AcademicsSidebar';
import '../modules/jobs/pages/JobsList.css'; // Reusing jobs styles for hero

const AcademicExamsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    
    // Derived from URL
    const [activeLevelId, setActiveLevelId] = useState(() => searchParams.get('level'));

    useEffect(() => {
        const level = searchParams.get('level');
        if (level) {
            setActiveLevelId(level);
        } else if (location.search === "") {
            setActiveLevelId(null);
        }
    }, [searchParams, location.search]);

    const handleLevelChange = (levelId) => {
        const newParams = new URLSearchParams(searchParams);
        if (levelId) {
            newParams.set('level', levelId);
            newParams.delete('subject');
        } else {
            newParams.delete('level');
            newParams.delete('subject');
        }
        setSearchParams(newParams);
    };

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

            <div className="jobs-hero">
                <div className="container">
                    <h1>Academic Exams & Practice</h1>
                    <p>Navigate through our structured curriculum and practice assessments.</p>
                </div>
            </div>
            
            <main className="jobs-main-content">
                <div className="container">
                    <div className="jobs-layout">
                        <aside className="jobs-sidebar">
                            <AcademicsSidebar 
                                activeLevelId={activeLevelId} 
                                onLevelChange={handleLevelChange} 
                            />
                        </aside>
                        
                        <div className="jobs-content-area">
                            <StudentAcademicsExplorer 
                                showHeader={false} 
                                style={{ padding: '0', background: 'transparent' }} 
                                activeLevelId={activeLevelId}
                                activeLanguage={activeLanguage}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AcademicExamsPage;
