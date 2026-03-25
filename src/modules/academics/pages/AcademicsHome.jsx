import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { academicsService } from '../../../services/academicsService';
import { useInfiniteArticles } from '../../../hooks/useArticles';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import TopStoriesHero from '../../../components/home/TopStoriesHero';
import { useHomeContent, useTrendingArticles } from '../../../hooks/useHomeContent';
import TaxonomyTabs from '../../../components/ui/TaxonomyTabs';
import ArticleCard from '../../../components/ui/ArticleCard';
import API_CONFIG from '../../../config/api.config';
import { getTranslations } from '../../../utils/translations';
import './Academics.css';
import '../../../pages/Articles.css'; // Reuse article styles

const AcademicsHome = () => {
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || searchParams.get('level');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');

    const isFiltered = !!(categoryParam || subParam || segmentParam);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    
    const t = getTranslations(activeLanguage);

    const filters = useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: 'academics',
        category: categoryParam || undefined,
        sub_category: subParam || undefined,
        segment: segmentParam || undefined,
        limit: 12
    }), [activeLanguage, categoryParam, subParam, segmentParam]);

    const {
        data: articlesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: articlesLoading,
        isError: articlesError,
        refetch
    } = useInfiniteArticles(filters);

    const { data: homeContent, isLoading: homeLoading } = useHomeContent(activeLanguage, 10);
    const { data: trendingArticles } = useTrendingArticles(5, activeLanguage);

    const allArticles = useMemo(() => 
        articlesData?.pages.flatMap(page => page.results) || [], 
    [articlesData]);

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



    return (
        <div className="academics-home-page">
            <TopBar />
            <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} activeLanguage={activeLanguage} onLanguageChange={(lang) => {
                setActiveLanguage(lang);
                localStorage.setItem('preferredLanguage', lang);
            }} />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="container mt-4">
                <TaxonomyTabs sectionSlug="academics" />
            </div>

            {!isFiltered && (
                <TopStoriesHero 
                    topStories={homeContent?.top_stories?.filter(s => s.section === 'academics') || homeContent?.latest?.results?.filter(s => s.section === 'academics')?.slice(0, 5) || []}
                    loading={homeLoading}
                    activeLanguage={activeLanguage}
                    title="Academic Top Stories"
                    viewAllLink="/academics"
                    sidebarBlocks={[
                        {
                            title: "Next in Academics",
                            items: homeContent?.latest?.results?.filter(s => s.section === 'academics')?.slice(5, 8) || [],
                            viewAllLink: "/academics"
                        },
                        {
                            title: "Most Popular",
                            items: trendingArticles?.filter(s => s.section === 'academics')?.slice(0, 3) || trendingArticles?.slice(0, 3) || [],
                            viewAllLink: "/articles"
                        }
                    ]}
                />
            )}

            <main className="container main-content articles-page">
                <div className="academics-articles-section">
                    {articlesLoading && allArticles.length === 0 ? (
                        <div className="articles-loading py-5 text-center">
                            <div className="spinner mx-auto mb-3"></div>
                            <p>Loading articles...</p>
                        </div>
                    ) : articlesError ? (
                        <div className="articles-error py-5 text-center">
                            <i className="fas fa-exclamation-triangle mb-3 text-red-500 fa-2x"></i>
                            <h2>Failed to load articles</h2>
                            <button onClick={() => refetch()} className="btn-premium mt-3">Retry</button>
                        </div>
                    ) : allArticles.length === 0 ? (
                        <div className="articles-empty py-5 text-center bg-gray-50 rounded-lg">
                            <i className="fas fa-search mb-3 text-gray-300 fa-2x"></i>
                            <h3>No articles found</h3>
                            <p>Try selecting a different category or state.</p>
                        </div>
                    ) : (
                        <>
                            <div className="section-title mb-3">
                                <h2 className="premium-title" style={{fontSize: '1.5rem'}}>
                                    {isFiltered ? 'Filtered Content' : 'Latest in Academics'}
                                </h2>
                            </div>
                                <div className="articles-grid">
                                    {allArticles.map((article) => (
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
                                <div className="load-more-section mt-5 text-center">
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="btn-load-more"
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AcademicsHome;
