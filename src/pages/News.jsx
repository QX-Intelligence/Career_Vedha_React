import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useInfiniteArticles } from '../hooks/useArticles';
import { useTrendingArticles } from '../hooks/useHomeContent';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import API_CONFIG from '../config/api.config';
import { getTranslations } from '../utils/translations';
import TopStoriesHero from '../components/home/TopStoriesHero';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import ContentHubWidget from '../components/ui/ContentHubWidget';
import './Articles.css';

const NewsPage = () => {
    const { activeLanguage } = useLanguage();
    const t = getTranslations(activeLanguage);
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || searchParams.get('level');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');
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
        category: categoryParam || undefined,
        sub_category: subParam || undefined,
        segment: segmentParam || undefined,
        q: debouncedSearch || undefined,
        limit: 12
    }), [activeLanguage, debouncedSearch, categoryParam, subParam, segmentParam]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteArticles(filters);

    // Infinite scroll: sentinel at bottom triggers next page load
    const sentinelRef = useRef(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    console.log('Sentinel intersecting, fetching next page...');
                    fetchNextPage();
                }
            },
            {
                rootMargin: '400px', // Fetch 400px before reaching the bottom
                threshold: 0
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles(5, activeLanguage);

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
            <Header />
            <PrimaryNav />

            <TaxonomyTabs sectionSlug="news" />


            <TopStoriesHero
                topStories={allArticles.slice(0, 5)}
                loading={isLoading || trendingLoading}
                activeLanguage={activeLanguage}
                title={t.topStories || "Top News"}
                viewAllLink="/news"
                sidebarBlocks={[
                    {
                        title: "More News",
                        items: allArticles.slice(5, 8),
                        viewAllLink: "/news"
                    },
                    {
                        title: "Most Popular",
                        items: trendingArticles || [],
                        viewAllLink: "/articles"
                    }
                ]}
            />

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
                                imageUrl = imageUrl || `https://placehold.co/600x400/62269E/333333?text=${encodeURIComponent(article.section || 'News')}`;

                                return (
                                    <Link 
                                        key={article.id} 
                                        to={`/article/${article.section || 'news'}/${article.slug}`} 
                                        className="article-card-link"
                                    >
                                        <article className="article-card">
                                            <div className="article-card-image">
                                                <img
                                                    src={imageUrl}
                                                    alt={article.title}
                                                    onError={(e) => {
                                                        e.target.src = "https://placehold.co/600x400/62269E/333333?text=News";
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
                                                    <span className="read-more-btn">
                                                        {t.readMore || 'Read More'} <i className="fas fa-arrow-right"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Infinite scroll sentinel */}
                        {hasNextPage && (
                            <div 
                                ref={sentinelRef} 
                                className="load-more-section"
                                style={{ height: '40px', margin: '20px 0', width: '100%', minHeight: '40px' }}
                            >
                                {isFetchingNextPage ? (
                                    <div className="articles-loading-mini">
                                        <div className="spinner mini mx-auto"></div>
                                        <p>{t.loadingMore || 'Loading more articles...'}</p>
                                    </div>
                                ) : (
                                    <div style={{ opacity: 0 }}>Scroll for more</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <div className="container mt-5 mb-5 pt-4">
                <ContentHubWidget
                    searchQuery="Trending"
                    title="Discover More"
                    minimal={false}
                />
            </div>

            <Footer />
        </div>
    );
};

export default NewsPage;
