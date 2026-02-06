import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { academicsService } from '../../../services/academicsService';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import './Academics.css';

const MaterialDetail = () => {
    const { slug } = useParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { data: material, isLoading, error } = useQuery({
        queryKey: ['material-detail', slug],
        queryFn: () => academicsService.getMaterialDetail(slug),
        enabled: !!slug,
    });

    if (error) {
        return <div className="error-container">Error loading material.</div>;
    }

    return (
        <div className="material-detail-page">
            <TopBar />
            <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="material-hero">
                <div className="container">
                    {isLoading ? (
                        <div className="skeleton-hero-text"></div>
                    ) : (
                        <div className="material-header-content">
                            <div className="breadcrumb">
                                <Link to="/academics">Academics</Link>
                                <i className="fas fa-chevron-right"></i>
                                {material.subject && (
                                    <>
                                        <Link to={`/academics/subject/${material.subject.slug}`}>{material.subject.name}</Link>
                                        <i className="fas fa-chevron-right"></i>
                                    </>
                                )}
                                <span>{material.title}</span>
                            </div>
                            <h1>{material.title}</h1>
                            <div className="material-meta-premium">
                                <span className="category-badge">{material.category?.name}</span>
                                <span className="date"><i className="far fa-calendar-alt"></i> {new Date(material.created_at).toLocaleDateString()}</span>
                                <span className="type"><i className="fas fa-info-circle"></i> {material.material_type}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <main className="container main-content material-view">
                {isLoading ? (
                    <div className="skeleton-content"></div>
                ) : (
                    <div className="material-container-premium">
                        {material.material_type === 'CONTENT' && (
                            <div 
                                className="content-body article-type-content"
                                dangerouslySetInnerHTML={{ __html: material.content }}
                            />
                        )}

                        {material.material_type === 'DOCUMENT' && material.media_links?.length > 0 && (
                            <div className="document-section">
                                <h3>Available Documents</h3>
                                <div className="docs-list">
                                    {material.media_links.map(link => (
                                        <div key={link.id} className="doc-card">
                                            <div className="doc-info">
                                                <i className="fas fa-file-pdf"></i>
                                                <div>
                                                    <p className="doc-name">{link.media.title || 'Study Material'}</p>
                                                    <p className="doc-size">{(link.media.file_size / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={link.media.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="download-link"
                                            >
                                                View Document <i className="fas fa-external-link-alt"></i>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {material.external_url && (
                            <div className="external-link-section">
                                <p>This material is hosted externally.</p>
                                <a 
                                    href={material.external_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn-premium"
                                >
                                    Access Material <i className="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        )}
                        
                        <div className="interaction-footer">
                            <button className="share-btn"><i className="fas fa-share-alt"></i> Share</button>
                            <button className="print-btn" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default MaterialDetail;
