import React, { useState } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import StudentAcademicsExplorer from '../components/home/StudentAcademicsExplorer';
import { useLanguage } from '../context/LanguageContext';
import TopBar from '../components/layout/TopBar';

const Curriculum = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage, langCode } = useLanguage();

    return (
        <div className="curriculum-page">
            <TopBar />
            <Header 
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                isMenuOpen={isMobileMenuOpen} 
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
                    activeLanguage={langCode} 
                />
            </div>

            <Footer />
        </div>
    );
};

export default Curriculum;
