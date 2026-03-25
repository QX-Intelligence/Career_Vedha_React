import React, { useState, useEffect, useMemo } from 'react';
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
import ArticleCard from '../components/ui/ArticleCard';
import './Articles.css';

const NewsPage = () => {
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
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

    const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles(5, activeLanguage);

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
                            {filteredArticles.map((article) => (
                                <ArticleCard 
                                    key={article.id} 
                                    article={article} 
                                    formatDate={formatDate}
                                    activeLanguage={activeLanguage}
                                    t={{ readMore: t.readMore }}
                                />
                            ))}
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
