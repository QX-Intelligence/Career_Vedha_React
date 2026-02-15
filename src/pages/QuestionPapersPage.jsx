import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionPaperService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import '../styles/contact-papers.css';

const QuestionPapersPage = () => {
    const [papers, setPapers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });

    const fetchPapers = async (loadMore = false) => {
        setIsLoading(true);
        try {
            const data = await questionPaperService.getPapersByCategory(
                'QUESTIONPAPER',
                loadMore ? cursor : null,
                20
            );
            
            if (loadMore) {
                setPapers(prev => [...prev, ...data]);
            } else {
                setPapers(data);
            }
            
            // Set cursor for next page (last item's creationDate)
            if (data.length > 0) {
                setCursor(data[data.length - 1].creationDate);
                setHasMore(data.length === 20);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch papers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []);

    const filteredPapers = papers.filter(paper =>
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paper.description && paper.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <Header 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                activeLanguage={activeLanguage}
                setActiveLanguage={setActiveLanguage}
            />
            <PrimaryNav 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            
            <div className="papers-page">
                <div className="papers-hero">
                    <div className="container">
                        <h1>Question Papers</h1>
                        <p>Access previous year question papers for various competitive exams</p>
                    </div>
                </div>

                <div className="container">
                    <div className="papers-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search question papers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="papers-count">
                            {filteredPapers.length} {filteredPapers.length === 1 ? 'paper' : 'papers'} found
                        </div>
                    </div>

                    {isLoading && papers.length === 0 ? (
                        <div className="papers-loading">
                            <i className="fas fa-spinner fa-spin"></i> Loading papers...
                        </div>
                    ) : filteredPapers.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {filteredPapers.map((paper) => (
                                    <Link
                                        to={`/paper-viewer?url=${encodeURIComponent(paper.presignedUrl)}&title=${encodeURIComponent(paper.title)}`}
                                        key={paper.id}
                                        className="paper-card-large"
                                    >
                                        <div className="paper-icon">
                                            <i className="fas fa-file-pdf"></i>
                                        </div>
                                        <span className="paper-title">{paper.title}</span>
                                        {paper.description && (
                                            <span className="paper-description">{paper.description}</span>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {hasMore && !searchTerm && (
                                <div className="load-more-container">
                                    <button
                                        onClick={() => fetchPapers(true)}
                                        className="load-more-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
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
                            <p>
                                {searchTerm
                                    ? `No papers found matching "${searchTerm}"`
                                    : 'No question papers available at the moment.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default QuestionPapersPage;
