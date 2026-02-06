import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { academicsService } from '../../../services/academicsService';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import './Academics.css';

const AcademicsHome = () => {
    const [selectedBoard, setSelectedBoard] = useState('AP');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { data: levelBlocks, isLoading } = useQuery({
        queryKey: ['academic-blocks', selectedBoard],
        queryFn: () => academicsService.getLevelBlocks(selectedBoard),
    });

    const boards = [
        { id: 'AP', name: 'Andhra Pradesh', icon: '🏛️' },
        { id: 'TS', name: 'Telangana', icon: '🏛️' },
        { id: 'CBSE', name: 'CBSE', icon: '🏫' },
    ];

    return (
        <div className="academics-home-page">
            <TopBar />
            <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="academics-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Academic Excellence</h1>
                        <p>Comprehensive study materials, previous papers, and chapter-wise analysis for your success.</p>
                        
                        <div className="board-selector">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    className={`board-btn ${selectedBoard === board.id ? 'active' : ''}`}
                                    onClick={() => setSelectedBoard(board.id)}
                                >
                                    <span className="board-icon">{board.icon}</span>
                                    <span className="board-name">{board.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container main-content">
                {isLoading ? (
                    <div className="loading-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-block"></div>
                        ))}
                    </div>
                ) : (
                    <div className="level-blocks-grid">
                        {levelBlocks?.map(block => (
                            <section key={block.level.id} className="level-section">
                                <div className="section-header">
                                    <div className="header-title">
                                        <div className="marker"></div>
                                        <h2>{block.level.name}</h2>
                                    </div>
                                    <Link to={`/academics/level/${block.level.slug}`} className="view-all">
                                        View All Subjects <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>

                                <div className="subjects-grid">
                                    {block.subjects.map(subject => (
                                        <Link 
                                            key={subject.id} 
                                            to={`/academics/subject/${subject.slug}`} 
                                            className="subject-card-premium"
                                        >
                                            <div className="card-icon">
                                                {subject.icon ? (
                                                    <img src={subject.icon} alt={subject.name} />
                                                ) : (
                                                    <i className="fas fa-book-open"></i>
                                                )}
                                            </div>
                                            <div className="card-content">
                                                <h3>{subject.name}</h3>
                                                <span className="material-count">
                                                    {subject.material_count || 0} Materials
                                                </span>
                                            </div>
                                            <div className="hover-indicator">
                                                <i className="fas fa-chevron-right"></i>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default AcademicsHome;
