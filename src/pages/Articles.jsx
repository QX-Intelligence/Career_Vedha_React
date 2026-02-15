import React, { useState, useEffect, useMemo } from 'react';
import { useInfiniteArticles } from '../hooks/useArticles';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import API_CONFIG from '../config/api.config';
import { newsService, taxonomyService } from '../services';
import './Articles.css';

const ArticlesPage = () => {
    const [sections, setSections] = useState([]);
    const [isLoadingSections, setIsLoadingSections] = useState(true);

    // Fetch sections from backend
    useEffect(() => {
        const fetchSections = async () => {
            try {
                setIsLoadingSections(true);
                const data = await taxonomyService.getSections();
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
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
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

    useEffect(() => {
        if (categoryParam) {
            setActiveCategory(categoryParam.toLowerCase());
        }
    }, [categoryParam]);

    const filters = {
        lang: activeLanguage,
        section: activeSection !== 'all' ? activeSection : undefined,
        category: activeCategory || undefined,
        q: searchQuery || undefined
    };

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

    return (
        <div className="articles-page-wrapper">
            <Header
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav />

            {/* Hero Section */}
            <div className="articles-hero">
                <div className="articles-hero-glow"></div>
                <div className="container px-4 mx-auto text-center">
                    <span className="articles-hero-badge">
                        <i className="fas fa-newspaper"></i> Explore Articles
                    </span>
                    <h1>Knowledge Hub</h1>
                    <p>Deep dives into academics, exams, career guidance, and latest educational news.</p>
                </div>
            </div>

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
                                imageUrl = imageUrl || "https://placehold.co/600x400/FFC107/333333?text=Article";

                                return (
                                    <article key={article.id} className="article-card">
                                        <div className="article-card-image">
                                            <img
                                                src={imageUrl}
                                                alt={article.title}
                                                onError={(e) => {
                                                    e.target.src = "https://placehold.co/600x400/FFC107/333333?text=Article";
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
                                                <Link 
                                                    to={`/article/${article.section || 'null'}/${article.slug}`} 
                                                    className="read-more-btn"
                                                >
                                                    Read Full Story <i className="fas fa-arrow-right"></i>
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
                                            Loading more...
                                        </>
                                    ) : (
                                        'Load More Articles'
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

export default ArticlesPage;
