import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsService } from '../../../services';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import Sidebar from '../../../components/home/Sidebar';

const ArticleDetail = () => {
    const { section, slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'english';
    });

    useEffect(() => {
        const fetchArticle = async () => {
            setLoading(true);
            try {
                const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
                const data = await newsService.getArticleDetail(section, slug, langCode);
                setArticle(data);

                // Track view after successful fetch
                newsService.trackView(section, slug);
            } catch (error) {
                // console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [section, slug, activeLanguage]);

    // Effect to handle external links in article content
    // Effect to handle external links in article content
    useEffect(() => {
        if (!loading && article) {
            const contentDiv = document.querySelector('.article-rich-text');
            if (contentDiv) {
                const links = contentDiv.querySelectorAll('a');
                links.forEach(link => {
                    let href = link.getAttribute('href');
                    if (href) {
                        // If it starts with slash, it's relative (keep it)
                        // If it starts with http/https, it's absolute
                        // If it doesn't start with http/https/slash/mailto/tel, assume it's external domain (e.g. youtube.com)
                        
                        const isProtocol = href.match(/^[a-zA-Z]+:/); // matches http:, mailto:, etc.
                        const isRelative = href.startsWith('/') || href.startsWith('#');
                        
                        if (!isProtocol && !isRelative) {
                            // Assume it's a domain like "youtube.com" -> prefix with https
                            href = 'https://' + href;
                            link.setAttribute('href', href);
                        }

                        // Now check if it's external to open in new tab
                        if (href.startsWith('http') || href.startsWith('https')) {
                            if (!href.includes(window.location.hostname)) {
                                link.setAttribute('target', '_blank');
                                link.setAttribute('rel', 'noopener noreferrer');
                            }
                        }
                    }
                });
            }
        }
    }, [article, loading]);

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
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recent';
        }
    };

    if (loading) {
        return (
            <div className="article-detail-loading">
                <div className="spinner"></div>
                <p>Loading reading experience...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="article-not-found container">
                <h2>Article Not Found</h2>
                <p>The article you are looking for might have been moved or deleted.</p>
                <button onClick={() => navigate('/')} className="back-home-btn">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="article-page-wrapper">
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <main className="main-content">
                <div className="container">
                    <div className="content-layout">
                        <div className="article-header-section">
                            <nav className="breadcrumb">
                                <a href="/">Home</a> <span>/</span>
                                <a href="#">{article.section || 'General'}</a> <span>/</span>
                                <span className="current">{article.title}</span>
                            </nav>

                            {/* Featured Media Section - Blocked Banner, showing MAIN as per request */}
                            {(() => {
                                // Handle both 'media' (public API) and 'media_links' (CMS API)
                                const mediaArray = article.media || article.media_links || [];
                                
                                // Priority: MAIN media file (robust check)
                                const mainMedia = mediaArray.filter(item => {
                                    const usage = (item.usage || '').toUpperCase();
                                    return usage === 'MAIN' || usage === 'INLINE' || usage === 'GALLERY';
                                }).sort((a, b) => (a.position || 0) - (b.position || 0));

                                if (mainMedia.length === 0) {
                                    // Fallback if no MAIN media - check for other non-BANNER media or use article image
                                    // User said: "block banner and show the main media file"
                                    const fallbackImage = article.og?.image || article.og?.image_url || article.og_image_url || article.image || "https://placehold.co/1200x600/FFC107/333333?text=Career+Vedha";
                                    return (
                                        <div className="article-featured-image main-banner">
                                            <img
                                                src={fallbackImage}
                                                alt={article.title}
                                            />
                                        </div>
                                    );
                                }

                                // We render the FIRST MAIN media to avoid duplication
                                const item = mainMedia[0];
                                const mediaUrl = item.url || item.media_details?.url;
                                const mediaType = item.media_type || item.media_details?.media_type;
                                const mediaTitle = item.media_details?.title || article.title;

                                if (!mediaUrl) return null;

                                return (
                                    <div className="article-featured-media main-banner">
                                        {mediaType === 'image' || mediaType === 'banner' ? (
                                            <div className="article-featured-image">
                                                <img
                                                    src={mediaUrl}
                                                    alt={mediaTitle}
                                                />
                                            </div>
                                        ) : mediaType === 'video' ? (
                                            <div className="article-featured-video">
                                                <video controls style={{ width: '100%', borderRadius: '12px' }}>
                                                    <source src={mediaUrl} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })()}

                            <h1 className="article-main-title">{article.title}</h1>

                            <div className="article-meta-large">
                                <div className="meta-item">
                                    <i className="far fa-calendar-alt"></i>
                                    <span>{formatDate(article.published_at || article.created_at)}</span>
                                </div>
                                <div className="meta-item">
                                    <i className="far fa-user"></i>
                                    <span>Admin</span>
                                </div>
                                <div className="meta-item">
                                    <i className="far fa-eye"></i>
                                    <span>{article.views_count || 0} Views</span>
                                </div>
                            </div>

                            <div className="article-body-content">
                                {article.summary && <p className="article-summary-lead">{article.summary}</p>}
                                <div
                                    className="article-rich-text"
                                    dangerouslySetInnerHTML={{ __html: article.content || '<p>No content available.</p>' }}
                                />
                            </div>

                            <div className="article-footer-tags">
                                {article.tags && (Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag, idx) => {
                                    const tagText = typeof tag === 'string' ? tag.trim() : (tag.name || String(tag));
                                    if (!tagText) return null;
                                    return <span key={idx} className="tag-badge">#{tagText}</span>;
                                })}
                            </div>
                        </div>
                        <Sidebar />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ArticleDetail;
