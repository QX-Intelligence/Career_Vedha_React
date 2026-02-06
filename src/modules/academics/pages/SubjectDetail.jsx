import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { academicsService } from '../../../services/academicsService';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import './Academics.css';

const SubjectDetail = () => {
    const { slug } = useParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLang, setActiveLang] = useState('te');

    const { data: blocks, isLoading } = useQuery({
        queryKey: ['subject-blocks', slug, activeLang],
        queryFn: () => academicsService.getSubjectBlocks(slug, activeLang),
        enabled: !!slug,
    });

    return (
        <div className="subject-detail-page">
            <TopBar />
            <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="detail-header">
                <div className="container">
                    <div className="header-flex">
                        <div className="breadcrumb">
                            <Link to="/academics">Academics</Link>
                            <i className="fas fa-chevron-right"></i>
                            <span>Subject Detail</span>
                        </div>
                        <div className="lang-toggle-premium">
                            <button 
                                className={activeLang === 'te' ? 'active' : ''} 
                                onClick={() => setActiveLang('te')}
                            >
                                తెలుగు
                            </button>
                            <button 
                                className={activeLang === 'en' ? 'active' : ''} 
                                onClick={() => setActiveLang('en')}
                            >
                                English
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container main-content">
                {isLoading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton-chapter"></div>
                        ))}
                    </div>
                ) : (
                    <div className="chapters-stack">
                        {blocks?.map(block => (
                            <section key={block.chapter.id} className="chapter-section">
                                <div className="chapter-header-premium">
                                    <div className="title-box">
                                        <span className="chapter-label">Chapter</span>
                                        <h2>{block.chapter.name}</h2>
                                    </div>
                                </div>

                                <div className="materials-grid-premium">
                                    {block.materials.map(material => (
                                        <Link 
                                            key={material.id} 
                                            to={`/academics/material/${material.slug}`} 
                                            className={`material-item-card ${material.material_type.toLowerCase()}`}
                                        >
                                            <div className="type-badge">
                                                {material.material_type}
                                            </div>
                                            <div className="material-info">
                                                <h3>{material.title}</h3>
                                                <div className="meta">
                                                    <span><i className="far fa-clock"></i> {new Date(material.created_at).toLocaleDateString()}</span>
                                                    {material.file_size && (
                                                        <span><i className="far fa-file-alt"></i> {(material.file_size / 1024).toFixed(0)} KB</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="action-icon">
                                                {material.material_type === 'DOCUMENT' ? (
                                                    <i className="fas fa-file-pdf"></i>
                                                ) : (
                                                    <i className="fas fa-eye"></i>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                    {block.materials.length === 0 && (
                                        <div className="empty-state">
                                            No materials available for this chapter yet.
                                        </div>
                                    )}
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

export default SubjectDetail;
