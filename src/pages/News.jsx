import React, { useState, useEffect, useMemo } from 'react';
import { useInfiniteArticles } from '../hooks/useArticles';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import API_CONFIG from '../config/api.config';
import { getTranslations } from '../utils/translations';
import './Articles.css';

const NewsPage = () => {
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });
    const t = getTranslations(activeLanguage);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search query to prevent excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Memoize filters to prevent unnecessary re-renders/refetches
    const filters = useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: 'news',
        q: debouncedSearch || undefined,
        search: debouncedSearch || undefined, // Aliasing q as search for backend compatibility
        limit: 12
    }), [activeLanguage, debouncedSearch]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteArticles(filters);

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

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

    const allArticles = data?.pages.flatMap(page => page.results) || [];

    // Client-side filtering because backend published endpoint ignores q/search when section is present
    const filteredArticles = useMemo(() => {
        if (!debouncedSearch) return allArticles;
        
        const query = debouncedSearch.toLowerCase().trim();
        return allArticles.filter(article => {
            const title = (article.title || '').toLowerCase();
            const summary = (article.summary || '').toLowerCase();
            const section = (article.section || '').toLowerCase();
            
            return title.includes(query) || 
                   summary.includes(query) || 
                   section.includes(query);
        });
    }, [allArticles, debouncedSearch]);

    return (
        <div className="articles-page-wrapper">
            <Header
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav />

            {/* Hero Section */}
            <div className="articles-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <div className="articles-hero-glow"></div>
                <div className="container px-4 mx-auto text-center">
                    <span className="articles-hero-badge">
                        <i className="fas fa-bullhorn"></i> {t.latestUpdates || 'Latest Updates'}
                    </span>
                    <h1>{t.navNews || 'News'}</h1>
                    <p>{t.newsSubtitle || 'Stay informed with the latest announcements, circulars, and educational updates.'}</p>
                </div>
            </div>

            {/* Filters Bar - Simplified */}
            <div className="articles-filters-bar">
                <div className="filters-container" style={{ justifyContent: 'center' }}>
                    <div className="search-input-wrapper" style={{ maxWidth: '600px', width: '100%' }}>
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder || "Search news..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="articles-search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="articles-main">
                {isLoading ? (
                    <div className="articles-loading">
                        <div className="spinner mx-auto mb-4"></div>
                        <p>{t.loading || 'Loading news...'}</p>
                    </div>
                ) : isError ? (
                    <div className="articles-error">
                        <i className="fas fa-exclamation-triangle mb-4 text-red-500" style={{ fontSize: '48px' }}></i>
                        <h2>Something went wrong</h2>
                        <p className="mb-6">We couldn't load the news. Please try again later.</p>
                        <button 
                            onClick={() => refetch()}
                            className="btn-load-more"
                        >
                            Retry Request
                        </button>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="articles-empty">
                        <i className="fas fa-search"></i>
                        <h2>{t.noNewsFound || 'No news found'}</h2>
                        <p>{debouncedSearch ? `No results for "${debouncedSearch}" in loaded articles.` : "Try adjusting your search to find what you're looking for."}</p>
                    </div>
                ) : (
                    <>
                        <div className="articles-grid">
                            {filteredArticles.map((article) => {
                                // Resolve image URL
                                let imageUrl = article.featured_media?.url || article.og_image_url;
                                if (imageUrl && imageUrl.startsWith('/')) {
                                    imageUrl = `${API_CONFIG.DJANGO_BASE_URL.replace('/api', '')}${imageUrl}`;
                                }
                                imageUrl = imageUrl || `https://placehold.co/600x400/FFC107/333333?text=${encodeURIComponent(article.section || 'News')}`;

                                return (
                                    <article key={article.id} className="article-card">
                                        <div className="article-card-image">
                                            <img
                                                src={imageUrl}
                                                alt={article.title}
                                                onError={(e) => {
                                                    e.target.src = "https://placehold.co/600x400/FFC107/333333?text=News";
                                                }}
                                            />
                                            <div className="article-card-badge">
                                                {article.section || 'News'}
                                            </div>
                                        </div>
                                        <div className="article-card-content">
                                            <h3 className="news-title">{article.title}</h3>
                                            <p className="news-description">{article.summary || article.title}</p>
                                            <div className="news-card-footer">
                                                <div className="news-date">
                                                    <i className="far fa-clock"></i>
                                                    {formatDate(article.published_at || article.created_at)}
                                                </div>
                                                <Link 
                                                    to={`/article/${article.section || 'news'}/${article.slug}`} 
                                                    className="read-more-btn"
                                                >
                                                    {t.readMore || 'Read More'} <i className="fas fa-arrow-right"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {hasNextPage && (
                            <div className="load-more-section">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="btn-load-more"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <div className="spinner"></div>
                                            {t.loading || 'Loading...'}
                                        </>
                                    ) : (
                                        t.loadMore || 'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default NewsPage;
