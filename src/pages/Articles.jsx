import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useInfiniteArticles } from '../hooks/useArticles';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTrendingArticles } from '../hooks/useHomeContent';
import API_CONFIG from '../config/api.config';
import { newsService, taxonomyService } from '../services';
import TopStoriesHero from '../components/home/TopStoriesHero';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import ContentHubWidget from '../components/ui/ContentHubWidget';
import './Articles.css';

const ArticlesPage = () => {
    const [sections, setSections] = useState([]);
    const [isLoadingSections, setIsLoadingSections] = useState(true);

    // Fetch sections from backend
    useEffect(() => {
        const fetchSections = async () => {
            try {
                setIsLoadingSections(true);
                const data = await taxonomyService.getSections(false, activeLanguage);
                // Ensure ALL is always there
                const dynamicSections = [
                    { id: 'all', name: 'ALL' },
                    ...(Array.isArray(data) ? data : [])
                ];
                setSections(dynamicSections);
            } catch (error) {
                console.error('Failed to fetch sections:', error);
                setSections([{ id: 'all', name: 'ALL' }]);
            } finally {
                setIsLoadingSections(false);
            }
        };
        fetchSections();
    }, []);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || searchParams.get('level');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');
    const sectionParam = searchParams.get('section');

    const [activeSection, setActiveSection] = useState(() => (sectionParam || 'all').toLowerCase());
    const [activeCategory, setActiveCategory] = useState(() => categoryParam?.toLowerCase() || null);

    // Sync state with URL params
    useEffect(() => {
        if (sectionParam) {
            setActiveSection(sectionParam.toLowerCase());
        } else if (!sectionParam && location.search === "") {
            // Reset to all if no params (back to main articles)
            setActiveSection('all');
        }
    }, [sectionParam, location.search]);

    const [navContext, setNavContext] = useState(null);

    useEffect(() => {
        const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
        const handleUpdate = (e) => {
            if (e.detail) setNavContext(e.detail);
        };
        const eventName = `cv-nav-updated-${langCode}`;
        window.addEventListener(eventName, handleUpdate);
        return () => window.removeEventListener(eventName, handleUpdate);
    }, [activeLanguage]);

    // Resolve State/District/Segment names from dynamic nav context for UI
    const hierarchyNames = useMemo(() => {
        if (!categoryParam || !navContext || !navContext.data) return null;
        try {
            const { data } = navContext;

            // Try to find in any section that matches activeSection
            const mapSlugToKey = (slug) => {
                if (slug === 'campus-pages') return 'campusPages';
                if (slug === 'current-affairs') return 'currentAffairs';
                if (slug === 'academic-exams' || slug === 'exams') return 'exams';
                return slug;
            };

            const sectionData = data[mapSlugToKey(activeSection)];
            if (!sectionData) return null;

            const stateNode = sectionData.find(c => c.slug === categoryParam || String(c.id) === String(categoryParam));
            const districtNode = subParam ? stateNode?.children?.find(s => s.slug === subParam || String(s.id) === String(subParam)) : null;
            const segmentNode = segmentParam ? districtNode?.children?.find(seg => seg.slug === segmentParam || String(seg.id) === String(segmentParam)) : null;

            return {
                state: stateNode?.name,
                district: districtNode?.name,
                segment: segmentNode?.name
            };
        } catch (e) {
            return null;
        }
    }, [activeSection, categoryParam, subParam, segmentParam, navContext]);

    const filters = useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: activeSection !== 'all' ? activeSection : undefined,
        category: categoryParam || undefined,
        sub_category: subParam || undefined,
        segment: segmentParam || undefined,
        q: searchQuery || undefined
    }), [activeLanguage, activeSection, categoryParam, subParam, segmentParam, searchQuery]);

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

    const allArticles = data?.pages.flatMap(page => page.results) || [];

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
        <div className="articles-page-wrapper">
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />




            {/* Filters Bar */}
            <div className="articles-filters-bar">
                <div className="filters-container">
                    <div className="section-tabs">
                        {isLoadingSections ? (
                            <div className="tabs-loading-shimmer"></div>
                        ) : (
                            sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
                                >
                                    {section.name}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="search-input-wrapper">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="articles-search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Hierarchical Header for Campus Pages / Regional News */}
            {hierarchyNames && (hierarchyNames.state || hierarchyNames.district) && (
                <div className="taxonomy-header-container">
                    <div className="taxonomy-breadcrumb">
                        {hierarchyNames.state && <span className="state-name">{hierarchyNames.state}</span>}
                        {hierarchyNames.district && (
                            <>
                                <i className="fas fa-chevron-right separator"></i>
                                <span className="district-name">{hierarchyNames.district}</span>
                            </>
                        )}
                        {hierarchyNames.segment && (
                            <>
                                <i className="fas fa-chevron-right separator"></i>
                                <span className="segment-name">{hierarchyNames.segment}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sub-taxonomy Tabs (States/Districts/Segments) */}
            {['academics', 'news', 'current-affairs', 'jobs', 'campus-pages', 'exams'].includes(activeSection) && (
                <TaxonomyTabs sectionSlug={activeSection} />
            )}

            <TopStoriesHero
                topStories={allArticles.slice(0, 5)}
                loading={isLoading || trendingLoading}
                activeLanguage={activeLanguage}
                title="Top Articles"
                viewAllLink="/articles"
                sidebarBlocks={[
                    {
                        title: "Next in Articles",
                        items: allArticles.slice(5, 8),
                        viewAllLink: "/articles"
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
                        <p>Loading your articles...</p>
                    </div>
                ) : isError ? (
                    <div className="articles-error">
                        <i className="fas fa-exclamation-triangle mb-4 text-red-500" style={{ fontSize: '48px' }}></i>
                        <h2>Something went wrong</h2>
                        <p className="mb-6">We couldn't load the articles. Please try again later.</p>
                        <button
                            onClick={() => refetch()}
                            className="btn-load-more"
                        >
                            Retry Request
                        </button>
                    </div>
                ) : allArticles.length === 0 ? (
                    <div className="articles-empty">
                        <i className="fas fa-search"></i>
                        <h2>No articles found</h2>
                        <p>Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                ) : (
                    <>
                        <div className="articles-grid">
                            {allArticles.map((article) => {
                                // Resolve image URL
                                let imageUrl = article.featured_media?.url || article.og_image_url;
                                if (imageUrl && imageUrl.startsWith('/')) {
                                    imageUrl = `${API_CONFIG.DJANGO_BASE_URL.replace('/api', '')}${imageUrl}`;
                                }
                                imageUrl = imageUrl || "https://placehold.co/600x400/62269E/333333?text=Article";

                                return (
                                    <Link 
                                        key={article.id} 
                                        to={`/article/${article.section || 'null'}/${article.slug}`} 
                                        className="article-card-link"
                                    >
                                        <article className="article-card">
                                            <div className="article-card-image">
                                                <img
                                                    src={imageUrl}
                                                    alt={article.title}
                                                    onError={(e) => {
                                                        e.target.src = "https://placehold.co/600x400/62269E/333333?text=Article";
                                                    }}
                                                />
                                                <div className="article-card-badge">
                                                    {article.section}
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
                                                        Read Full Story <i className="fas fa-arrow-right"></i>
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
                                        <p>Loading more articles...</p>
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

export default ArticlesPage;
