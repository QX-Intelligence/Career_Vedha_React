import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { newsService } from '../../services';
import Skeleton from '../ui/Skeleton';

const LatestArticles = memo(({ latest: initialLatest, loading: initialLoading, activeLanguage }) => {
    const [articles, setArticles] = useState(initialLatest?.results || []);
    const [totalCount, setTotalCount] = useState(initialLatest?.count || 0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const limit = 6;

    // Sync with initial data from parent
    useEffect(() => {
        if (initialLatest?.results) {
            setArticles(initialLatest.results);
            setTotalCount(initialLatest.count || 0);
        } else {
            setArticles([]);
            setTotalCount(0);
        }
        setCurrentPage(1);
    }, [initialLatest]);

    const fetchPage = async (page) => {
        setLoadingMore(true);
        try {
            const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
            const offset = (page - 1) * limit;
            const data = await newsService.getLatestArticles(langCode, limit, offset);
            setArticles(data.results || []);
            setTotalCount(data.count || 0);
            setCurrentPage(page);
            // Scroll to top of section for better UX
            const section = document.querySelector('.latest-articles-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Failed to load page", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Recent';
        try {
            const date = new Date(dateString);
            const locale = activeLanguage === 'telugu' ? 'te-IN' : 'en-IN';
            return date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recent';
        }
    };

    const totalPages = Math.ceil(totalCount / limit) || 1;

    if (initialLoading && articles.length === 0) {
        return (
            <section className="latest-articles-section">
                <div className="articles-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="article-card skeleton-loading">
                            <Skeleton variant="card" height="200px" />
                            <div className="article-content" style={{ marginTop: '1rem' }}>
                                <Skeleton variant="title" width="80%" style={{ marginBottom: '0.5rem' }} />
                                <Skeleton variant="text" count={2} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="no-articles">
                <i className="fas fa-newspaper"></i>
                <p>No articles found for the selected language.</p>
            </div>
        );
    }

    return (
        <section className="latest-articles-section">
            <div className={`articles-grid ${loadingMore ? 'loading-overlay' : ''}`}>
                {articles.map((article) => (
                    <article key={article.id} className="article-card">
                        <div className="article-image">
                            <img
                                src={article.featured_media?.url || article.og_image_url || "https://placehold.co/400x250/FFC107/333333?text=Article"}
                                alt={article.title}
                                onError={(e) => {
                                    e.target.src = "https://placehold.co/400x250/FFC107/333333?text=Article";
                                }}
                            />
                            <span className="article-badge">{article.section}</span>
                        </div>
                        <div className="article-content">
                            <h3 className="news-title">{article.title}</h3>
                            <p className="news-description">
                                {article.summary || article.title}
                            </p>
                            <div className="news-card-footer">
                                <div className="news-date">
                                    <i className="far fa-clock"></i> {formatDate(article.published_at || article.created_at)}
                                </div>
                                <Link to={`/article/${article.section}/${article.slug}`} className="read-more-btn">
                                    Read More <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination-container">
                    <button 
                        className="pagination-btn nav-btn"
                        onClick={() => fetchPage(currentPage - 1)}
                        disabled={currentPage === 1 || loadingMore}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        // Logic to show a window of pages
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                            <button
                                key={pageNum}
                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => fetchPage(pageNum)}
                                disabled={loadingMore}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button 
                        className="pagination-btn nav-btn"
                        onClick={() => fetchPage(currentPage + 1)}
                        disabled={currentPage === totalPages || loadingMore}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </section>
    );
});

export default LatestArticles;
