import React, { useState, useEffect, lazy, Suspense, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import Skeleton from '../components/ui/Skeleton';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import { useInfiniteArticles } from '../hooks/useArticles';
import API_CONFIG from '../config/api.config';
import './Articles.css';

// Lazy load heavier components
const PreviousPapers = lazy(() => import('../components/home/PreviousPapers'));

const SectionSkeleton = () => (
    <div className="container" style={{ padding: '2rem 0' }}>
        <Skeleton variant="title" width="30%" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Skeleton variant="card" count={3} />
        </div>
    </div>
);

const AcademicExamsPage = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });

    // Derived from URL
    const categoryParam = searchParams.get('category');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');

    // Resolve hierarchy names from cache for UI standard display
    const hierarchyNames = useMemo(() => {
        if (!categoryParam) return null;
        try {
            const cached = localStorage.getItem('cv_nav_tree_v3');
            if (!cached) return null;
            const { data } = JSON.parse(cached);

            const sectionData = data['exams'];
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
    }, [categoryParam, subParam, segmentParam]);

    const filters = useMemo(() => ({
        lang: activeLanguage === 'telugu' ? 'te' : 'en',
        section: 'exams',
        category: categoryParam || undefined,
        sub_category: subParam || undefined,
        segment: segmentParam || undefined
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

    const allArticles = data?.pages.flatMap(page => page.results) || [];

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [categoryParam, subParam, segmentParam]);

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
            <Helmet>
                <title>Exams | Career Vedha</title>
                <meta name="description" content="Explore entrance exams, competitive exams, and preparation material." />
            </Helmet>

            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            {/* Hierarchical Header for Exams */}
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

            <TaxonomyTabs sectionSlug="exams" />

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
                        <p className="mb-6">We couldn't load the articles at this time.</p>
                        <button onClick={() => refetch()} className="btn-load-more">
                            Retry Request
                        </button>
                    </div>
                ) : allArticles.length === 0 ? (
                    <div className="articles-empty">
                        <i className="fas fa-search"></i>
                        <h2>No exams found</h2>
                        <p>We couldn't find any articles matching this category.</p>
                    </div>
                ) : (
                    <>
                        <div className="articles-grid">
                            {allArticles.map((article) => {
                                let imageUrl = article.featured_media?.url || article.og_image_url;
                                if (imageUrl && imageUrl.startsWith('/')) {
                                    imageUrl = `${API_CONFIG.DJANGO_BASE_URL.replace('/api', '')}${imageUrl}`;
                                }
                                imageUrl = imageUrl || "https://placehold.co/600x400/FFC107/333333?text=Exam";

                                return (
                                    <Link 
                                        key={article.id} 
                                        to={`/article/exams/${article.slug}`} 
                                        className="article-card-link"
                                    >
                                        <article className="article-card">
                                            <div className="article-card-image">
                                                <img
                                                    src={imageUrl}
                                                    alt={article.title}
                                                    onError={(e) => {
                                                        e.target.src = "https://placehold.co/600x400/FFC107/333333?text=Exam";
                                                    }}
                                                />
                                                <div className="article-card-badge">
                                                    Exams
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

            <Suspense fallback={<SectionSkeleton />}>
                <PreviousPapers activeLanguage={activeLanguage} title="Previous Question Papers" />
            </Suspense>

            <Footer />
        </div>
    );
};

export default AcademicExamsPage;
