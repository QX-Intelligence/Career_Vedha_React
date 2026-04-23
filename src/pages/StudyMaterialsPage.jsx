import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { newsService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import { useInfiniteArticles } from '../hooks/useArticles';
import SEO from '../components/seo/SEO';
import '../styles/contact-papers.css';
import './Articles.css';

const StudyMaterialsPage = () => {
    const [searchParams] = useSearchParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage } = useLanguage();
    
    const categoryParam = searchParams.get('category') || searchParams.get('level');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');

    const filters = React.useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: 'study-materials',
        category: categoryParam || undefined,
        sub_category: subParam || undefined,
        segment: segmentParam || undefined,
        limit: 12
    }), [activeLanguage, categoryParam, subParam, segmentParam]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteArticles(filters);

    const materials = data?.pages.flatMap(page => page.results) || [];

    const handleLanguageChange = (lang) => {
        // No longer needed, handled by Context
    };

    const filteredMaterials = materials.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <SEO 
                title="Study Materials | Career Vedha"
                description="Expert curated lessons, notes, and study guides for all academic and competitive exams."
                keywords="study materials, notes, lessons, exam preparation, career vedha"
            />
            <Header 
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
            />
            <PrimaryNav />
            
            <TaxonomyTabs sectionSlug="study-materials" />
            
            <div className="papers-page">


                <div className="container">
                    <div className="papers-controls">
                        <div className="section-header">
                            <div>
                                <h1 className="premium-title">Study Materials</h1>
                                <p className="premium-subtitle">Expert curated lessons and notes</p>
                            </div>
                        </div>
                    </div>

                    {isLoading && materials.length === 0 ? (
                        <div className="premium-loader-container">
                            <div className="premium-spinner"></div>
                            <p>Loading materials...</p>
                        </div>
                    ) : materials.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {materials.map((material) => {
                                    const fileUrl = material.file_url || material.presignedUrl;
                                    return (
                                        <Link
                                            to={`/paper-viewer?url=${encodeURIComponent(fileUrl)}&title=${encodeURIComponent(material.title)}`}
                                            key={material.id}
                                            className="paper-card-large"
                                        >
                                            <div className="paper-icon material-icon">
                                                <i className="fas fa-book"></i>
                                            </div>
                                            <div className="paper-card-content">
                                                <span className="paper-title">{material.title}</span>
                                                {material.summary && (
                                                    <span className="paper-description">{material.summary}</span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {hasNextPage && (
                                <div className="load-more-container">
                                    <button
                                        onClick={() => fetchNextPage()}
                                        className="load-more-btn"
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Loading...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-arrow-down"></i> Load More
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="papers-empty">
                            <i className="fas fa-folder-open"></i>
                            <p>No study materials available for this selection.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default StudyMaterialsPage;
