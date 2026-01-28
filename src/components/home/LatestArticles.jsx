import React, { useState, useEffect } from 'react';
import { newsService } from '../../services';

const LatestArticles = ({ latest: initialLatest, loading: initialLoading, activeLanguage }) => {
    const [articles, setArticles] = useState(initialLatest?.results || []);
    const [hasNext, setHasNext] = useState(initialLatest?.has_next || false);
    const [nextCursor, setNextCursor] = useState(initialLatest?.next_cursor || null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Sync with initial data from parent
    useEffect(() => {
        if (initialLatest?.results) {
            setArticles(initialLatest.results);
            setHasNext(initialLatest.has_next);
            setNextCursor(initialLatest.next_cursor);
        } else {
            setArticles([]);
            setHasNext(false);
            setNextCursor(null);
        }
    }, [initialLatest]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
            const data = await newsService.getLatestArticles(langCode, 20, nextCursor);
            setArticles(prev => [...prev, ...data.results]);
            setHasNext(data.has_next);
            setNextCursor(data.next_cursor);
        } catch (error) {
            console.error("Failed to load more articles", error);
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

    if (initialLoading && articles.length === 0) {
        return (
            <section className="latest-articles-section container">
                <h2 className="section-title">Latest Articles</h2>
                <div className="articles-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="article-card skeleton"></div>
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
            {/* Header removed to avoid duplication with Home.jsx */}
            <div className="articles-grid">
                {articles.map((article) => (
                    <article key={article.id} className="article-card">
                        <div className="article-image">
                            <img
                                src={article.og_image_url || "https://placehold.co/400x250/FFC107/333333?text=Article"}
                                alt={article.title}
                                onError={(e) => {
                                    e.target.src = "https://placehold.co/400x250/FFC107/333333?text=Article";
                                }}
                            />
                            <span className="article-badge">{article.section}</span>
                        </div>
                        <div className="article-content">
                            <h3>{article.title}</h3>
                            <div className="article-meta">
                                <span><i className="far fa-clock"></i> {formatDate(article.published_at || article.created_at)}</span>
                                <span><i className="far fa-eye"></i> {article.views_count}</span>
                            </div>
                            <p className="article-summary">
                                {article.summary || article.title}
                            </p>
                            <a href={`/article/${article.section}/${article.slug}`} className="read-link">
                                Read More <i className="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </article>
                ))}
            </div>

            {hasNext && (
                <div className="load-more-container">
                    <button
                        className="load-more-btn"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                        ) : (
                            <>Load More Articles <i className="fas fa-plus"></i></>
                        )}
                    </button>
                </div>
            )}
        </section>
    );
};

export default LatestArticles;
