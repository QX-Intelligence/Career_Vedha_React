import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { newsService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import { useInfiniteArticles } from '../hooks/useArticles';
import '../styles/contact-papers.css';
import './Articles.css';

const QuestionPapersPage = () => {
    const [searchParams] = useSearchParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    
    const categoryParam = searchParams.get('category') || searchParams.get('level');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');

    const filters = React.useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: 'papers',
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

    const papers = data?.pages.flatMap(page => page.results) || [];

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    const filteredPapers = papers.filter(paper =>
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paper.description && paper.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <Header 
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav />
            
            <TaxonomyTabs sectionSlug="papers" />
            
            <div className="papers-page">


                <div className="container">
                    <div className="papers-controls">
                        <div className="section-header">
                            <h1 className="premium-title">Question Papers</h1>
                            <p className="premium-subtitle">Previous year papers and practice sets</p>
                        </div>
                    </div>

                    {isLoading && papers.length === 0 ? (
                        <div className="premium-loader-container">
                            <div className="premium-spinner"></div>
                            <p>Loading papers...</p>
                        </div>
                    ) : papers.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {papers.map((paper) => {
                                    const fileUrl = paper.file_url || paper.presignedUrl;
                                    return (
                                        <Link
                                            to={`/paper-viewer?url=${encodeURIComponent(fileUrl)}&title=${encodeURIComponent(paper.title)}`}
                                            key={paper.id}
                                            className="paper-card-large"
                                        >
                                            <div className="paper-icon">
                                                <i className="fas fa-file-pdf"></i>
                                            </div>
                                            <div className="paper-card-content">
                                                <span className="paper-title">{paper.title}</span>
                                                {paper.summary && (
                                                    <span className="paper-description">{paper.summary}</span>
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
                            <p>No question papers available for this selection.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default QuestionPapersPage;
