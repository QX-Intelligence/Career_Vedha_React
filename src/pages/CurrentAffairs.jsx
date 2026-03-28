import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import djangoApi from '../services/djangoApi'; 
import { currentAffairsService, newsService } from '../services';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import TopStoriesHero from '../components/home/TopStoriesHero';
import { useTrendingArticles } from '../hooks/useHomeContent';
import { getBestImageUrl } from '../utils/articleUtils';
import TaxonomyTabs from '../components/ui/TaxonomyTabs';
import ContentHubWidget from '../components/ui/ContentHubWidget';
import '../styles/CurrentAffairs.css';

// Translation data
const translations = {
    en: {
        title: "Current Affairs",
        subtitle: "Stay updated with the latest happenings",
        international: "International",
        national: "India",
        statewide: "State-wise",
        selectState: "Select State",
        loading: "Fetching news...",
        error: "Failed to load news. Please try again later.",
        noNews: "No news articles found for this category.",
        readFull: "Read Full",
        loadMore: "Load More Articles"
    },
    te: {
        title: "ప్రస్తుత వ్యవహారాలు",
        subtitle: "తాజా సంఘటనలతో అప్‌డేట్‌గా ఉండండి",
        international: "అంతర్జాతీయ",
        national: "భారతదేశం",
        statewide: "రాష్ట్ర వారీగా",
        selectState: "రాష్ట్రాన్ని ఎంచుకోండి",
        loading: "వార్తలు తీసుకుంటోంది...",
        error: "వార్తలను లోడ్ చేయడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
        noNews: "ఈ వర్గానికి వార్తా కథనాలు కనుగొనబడలేదు.",
        readFull: "పూర్తిగా చదవండి",
        loadMore: "మరిన్ని కథనాలు లోడ్ చేయండి"
    }
};

const CurrentAffairs = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });
    const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles(5, activeLanguage);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    // Sync with URL params
    const categoryParam = searchParams.get('category') || searchParams.get('level') || searchParams.get('region');
    const subParam = searchParams.get('sub_category') || searchParams.get('sub');
    const segmentParam = searchParams.get('segment');

    // Empty useEffect or removed since we'll just use searchParams directly

    const [hasMore, setHasMore] = useState(false);
    // Cursor pagination state
    const [cursorTime, setCursorTime] = useState(null);
    const [cursorId, setCursorId] = useState(null);
    const [djangoCursor, setDjangoCursor] = useState(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null); // Document viewer state
    const LIMIT = 12;

    const sentinelRef = useRef(null);

    // Infinite scroll observer
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && hasMore && !loading && !isFetchingMore) {
                    console.log('[CurrentAffairs] Sentinel intersecting, fetching next batch...');
                    handleLoadMore();
                }
            },
            { rootMargin: '400px', threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, isFetchingMore]);


    const lang = activeLanguage === 'telugu' ? 'te' : 'en';
    const langUpper = lang.toUpperCase();
    const t = translations[lang];

    // Mapping Django levels to Spring region codes for backward compatibility with Spring data
    const LEVEL_TO_SPRING_REGION = {
        'national': 'INDIA',
        'state-ap': 'AP',
        'state-tg': 'TS',
        'tg': 'TS',
        'ap': 'AP'
    };

    useEffect(() => {
        setNews([]);
        setCursorTime(null);
        setCursorId(null);
        setDjangoCursor(null);
        fetchNews(null, null, null, true);
    }, [activeLanguage, categoryParam, subParam, segmentParam]);

    const fetchNews = async (cTime = null, cId = null, dCursor = null, isFresh = false) => {
        try {
            if (isFresh) setLoading(true);
            else setIsFetchingMore(true);
            
            // 1. Prepare Params
            const springParams = { 
                language: langUpper, 
                limit: (categoryParam === 'INDIA' || categoryParam === 'national') ? 20 : LIMIT 
            };
            if (cTime) springParams.cursorTime = cTime;
            if (cId) springParams.cursorId = cId;

            // 2. Fetch from Django Source
            let djangoArticles = [];
            let nextDjangoCursor = null;
            
            // Only fetch Django if we are starting fresh or have a cursor for more
            if (isFresh || dCursor) {
                try {
                    const djangoParams = {
                        section: 'current-affairs',
                        lang: lang,
                        limit: 15,
                        cursor: dCursor
                    };
                    
                    if (categoryParam) djangoParams.category = categoryParam;
                    if (subParam) djangoParams.sub_category = subParam;
                    if (segmentParam) djangoParams.segment = segmentParam;
                    
                    if (categoryParam === 'INDIA' || categoryParam === 'national') djangoParams.category = 'national';
                    
                    const djangoRes = await newsService.getPublicArticles(djangoParams);
                    djangoArticles = (djangoRes.results || []).map(art => ({
                        ...art,
                        isDjango: true,
                        title: art.headline || art.title,
                        creationorupdationDate: art.published_at,
                        region: categoryParam === 'national' ? 'India' : (categoryParam || 'General')
                    }));
                    nextDjangoCursor = djangoRes.next_cursor || null;
                } catch (djangoErr) {
                    console.error('Error fetching Django current affairs:', djangoErr);
                }
            }

            // 3. Fetch from Spring Source
            let springArticles = [];
            let nextSTime = null;
            let nextSId = null;

            // Only fetch Spring if we are fresh OR we have a Spring cursor (avoid re-fetching Spring if we only have Django more)
            // But usually we fetch both in parallel for combined feeds
            if (isFresh || (cTime && cId)) {
                try {
                    let springResponse;
                    const springRegion = categoryParam || LEVEL_TO_SPRING_REGION[categoryParam] || LEVEL_TO_SPRING_REGION[subParam];

                    if (!springRegion || springRegion === 'ALL') {
                        springResponse = await currentAffairsService.getAllAffairs(springParams);
                    } else if (springRegion === 'INDIA') {
                        springResponse = await currentAffairsService.getAllAffairs(springParams);
                    } else {
                        springResponse = await currentAffairsService.getByRegion(springRegion, springParams);
                    }
                    
                    springArticles = Array.isArray(springResponse) ? springResponse : [];
                    if (springArticles.length > 0) {
                        const lastSpringItem = springArticles[springArticles.length - 1];
                        nextSTime = lastSpringItem.creationorupdationDate;
                        nextSId = lastSpringItem.id;
                    }
                } catch (springErr) {
                    console.error('Error fetching Spring current affairs:', springErr);
                }
            }

            console.log(`[CurrentAffairs] Batch Fetched - Django: ${djangoArticles.length}, Spring: ${springArticles.length}`);
            
            const combinedBatch = [...djangoArticles, ...springArticles];
            
            if (isFresh) {
                setNews(combinedBatch);
            } else {
                setNews(prev => [...prev, ...combinedBatch]);
            }
            
            // Update cursors for next fetch
            setDjangoCursor(nextDjangoCursor);
            setCursorTime(nextSTime);
            setCursorId(nextSId);

            // We have more if EITHER source returned a full batch or has a next cursor
            const springLimitUsed = (springParams.limit || LIMIT);
            const hasMoreSpring = springArticles.length >= springLimitUsed;
            const hasMoreDjango = !!nextDjangoCursor;
            
            setHasMore(hasMoreSpring || hasMoreDjango);
            setError(null);
        } catch (err) {
            console.error('Error fetching news:', err);
            setError(t.error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (loading || isFetchingMore) return;
        fetchNews(cursorTime, cursorId, djangoCursor);
    };

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    const stripHtml = (html) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    return (
        <div className="current-affairs-page">
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />
            
            <TaxonomyTabs sectionSlug="current-affairs" />

            <div className="container py-5">
                <div className="section-header mb-4">
                    <div className="header-title-section">
                        <h1 className="premium-title">{t.title}</h1>
                        <p className="premium-subtitle">{t.subtitle}</p>
                    </div>
                </div>

                <TopStoriesHero 
                    topStories={news.slice(0, 5)}
                    loading={loading || trendingLoading}
                    activeLanguage={activeLanguage}
                    title={t.title || "Current Affairs Headlines"}
                    viewAllLink="/current-affairs"
                    onItemClick={(item) => {
                        if (item.isDjango) {
                            navigate(`/article/${item.section}/${item.slug}`);
                        } else {
                            setSelectedDoc(item);
                        }
                    }}
                    sidebarBlocks={[
                        {
                            title: "More Headlines",
                            items: news.slice(5, 8),
                            viewAllLink: "/current-affairs"
                        },
                        {
                            title: "Most Popular",
                            items: trendingArticles?.slice(0, 3) || [],
                            viewAllLink: "/articles"
                        }
                    ]}
                />

                {loading ? (
                    <div className="premium-loader-container">
                        <div className="premium-spinner"></div>
                        <p>{t.loading}</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <i className="fas fa-exclamation-circle"></i>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="news-grid">
                            {news.length > 0 ? (
                                news.map((item, index) => (
                                    <div 
                                        key={item.id || index} 
                                        className="news-card-premium"
                                        onClick={() => {
                                            if (item.isDjango) navigate(`/article/${item.section}/${item.slug}`);
                                            else setSelectedDoc(item);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                    {(() => {
                                        const imageUrl = getBestImageUrl(item);
                                        return imageUrl ? (
                                            <div className="news-card-image">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={item.title} 
                                                    onError={(e) => {
                                                        if (imageUrl.toLowerCase().endsWith('.pdf')) {
                                                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
                                                        } else {
                                                            e.target.style.display = 'none';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : null;
                                    })()}
                                        <div className="news-card-content">
                                            <span className="region-tag">
                                                {item.region}
                                            </span>
                                            <h3 className="news-title">{item.title}</h3>
                                            <p className="news-description">
                                                {item.summary || stripHtml(item.description)}
                                            </p>
                                            <div className="news-card-footer">
                                                <span className="news-date">
                                                    {item.creationorupdationDate ? new Date(item.creationorupdationDate).toLocaleDateString() : ''}
                                                </span>
                                                <span className="read-more-link" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '0.9rem'}}>
                                                    {t.readFull} <i className="fas fa-arrow-right"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-news-message">
                                    <p>{t.noNews}</p>
                                </div>
                            )}
                        </div>

                        {/* Infinite scroll sentinel */}
                        {hasMore && (
                            <div 
                                ref={sentinelRef} 
                                className="load-more-container"
                                style={{ minHeight: '60px', marginTop: '2rem' }}
                            >
                                {isFetchingMore ? (
                                    <div className="premium-loader-container" style={{ padding: '1rem 0' }}>
                                        <div className="premium-spinner mini"></div>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{t.loading}</p>
                                    </div>
                                ) : (
                                    <div style={{ opacity: 0 }}>Scroll for more</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Document Viewer Modal */}
            {selectedDoc && (
                <div className="doc-viewer-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="doc-viewer-content" onClick={e => e.stopPropagation()}>
                        <div className="doc-viewer-header">
                            <span className="doc-viewer-title">{selectedDoc.title}</span>
                            <button className="doc-viewer-close" onClick={() => setSelectedDoc(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="doc-viewer-body">
                            {(() => {
                                const fileUrl = selectedDoc.fileUrl || '';
                                const cleanUrl = fileUrl.split('?')[0].toLowerCase();
                                const isPdf = cleanUrl.endsWith('.pdf');

                                if (isPdf) {
                                    return (
                                        <iframe 
                                            src={fileUrl} 
                                            className="doc-frame" 
                                            title="Document Viewer"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                document.getElementById('doc-error').style.display = 'block';
                                            }}
                                        ></iframe>
                                    );
                                } else {
                                    return (
                                        <img 
                                            src={fileUrl} 
                                            alt={selectedDoc.title} 
                                            className="doc-image" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                // If image fails, try showing as iframe (maybe it's a doc/pdf misclassified?)
                                                // Or just show error
                                                const parent = e.target.parentElement;
                                                const errorMsg = document.createElement('div');
                                                errorMsg.className = 'error-message';
                                                errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <p>Unable to preview this file correctly.</p><a href="' + fileUrl + '" target="_blank" class="download-link">Open in New Tab</a>';
                                                errorMsg.style.textAlign = 'center';
                                                errorMsg.style.marginTop = '2rem';
                                                parent.appendChild(errorMsg);
                                            }}
                                        />
                                    );
                                }
                            })()}
                            <div id="doc-error" style={{display: 'none', textAlign: 'center', marginTop: '2rem'}}>
                                <p>Unable to load document.</p>
                                <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="load-more-btn" style={{display: 'inline-flex', marginTop: '1rem'}}>
                                    Open in New Tab
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mt-5 mb-5 pt-4">
                <ContentHubWidget 
                    searchQuery="Current Affairs" 
                    title="Discover More"
                    minimal={false} 
                />
            </div>

            <Footer />
        </div>
    );
};

export default CurrentAffairs;
