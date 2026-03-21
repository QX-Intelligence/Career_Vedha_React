import React, { useState } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import StudentAcademicsExplorer from '../components/home/StudentAcademicsExplorer';
import TopBar from '../components/layout/TopBar';

const Curriculum = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    return (
        <div className="curriculum-page">
            <TopBar />
            <Header 
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                isMenuOpen={isMobileMenuOpen} 
                activeLanguage={activeLanguage} 
                onLanguageChange={handleLanguageChange} 
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="container" style={{ minHeight: '60vh', padding: '2rem 0' }}>
                <div className="section-title mb-4">
                    <h1 className="premium-title" style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '1rem' }}>
                        Course Materials & Quizzes
                    </h1>
                    <p className="premium-subtitle" style={{ textAlign: 'center' }}>
                        Explore your syllabus, download study materials, and take practice exams.
                    </p>
                </div>
                
                <StudentAcademicsExplorer 
                    showHeader={false} 
                    activeLanguage={activeLanguage === 'telugu' ? 'te' : 'en'} 
                />
            </div>

            <Footer />
        </div>
    );
};

export default Curriculum;
