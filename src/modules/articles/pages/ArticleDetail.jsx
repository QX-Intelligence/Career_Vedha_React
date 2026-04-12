import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { newsService } from '../../../services';
import TopBar from '../../../components/layout/TopBar';
import Header from '../../../components/layout/Header';
import PrimaryNav from '../../../components/layout/PrimaryNav';
import Footer from '../../../components/layout/Footer';
import Sidebar from '../../../components/home/Sidebar';
import ContentHubWidget from '../../../components/ui/ContentHubWidget';

const ArticleDetail = () => {
    const { section, slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { activeLanguage, langCode } = useLanguage();

    // Extract search context for the Content Hub
    const getSearchContext = () => {
        if (!article) return null;
        
        const safeTags = Array.isArray(article.tags) ? article.tags : (article.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        const textToScan = `${article.title} ${article.summary} ${article.section} ${safeTags.join(' ')}`.toLowerCase();
        
        // Priority keywords for aggregation
        const contexts = [
            { key: '10th Class', matches: ['10th', 'ssc', 'tenth'] },
            { key: 'Intermediate', matches: ['inter', 'intermediate', '12th', 'plus two'] },
            { key: 'B.Tech', matches: ['btech', 'b.tech', 'engineering'] },
            { key: 'Degree', matches: ['degree', 'bsc', 'bcom', 'ba'] },
            { key: 'Current Affairs', matches: ['current affairs', 'daily updates'] },
            { key: 'Jobs', matches: ['jobs', 'notification', 'recruitment'] }
        ];

        // Primary: Check for specific high-value tags first
        const tags = Array.isArray(article.tags) ? article.tags : (article.tags || '').split(',');
        const firstTag = tags[0]?.trim();
        if (firstTag && firstTag.length > 2) return firstTag.charAt(0).toUpperCase() + firstTag.slice(1);

        for (const ctx of contexts) {
            if (ctx.matches.some(m => textToScan.includes(m))) {
                return ctx.key;
            }
        }
        
        // Fallback to section name if it's specific enough
        if (article.section && article.section !== 'General') return article.section;
        
        return 'Latest Stories';
    };

    const searchContext = getSearchContext();

    useEffect(() => {
        const fetchArticle = async () => {
            setLoading(true);
            try {
                const data = await newsService.getArticleDetail(section, slug, langCode);
                setArticle(data);

                // Track view after successful fetch
                newsService.trackView(section, slug);
                
                // Reset scroll position on navigation
                window.scrollTo({ top: 0, behavior: 'instant' });
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
        // Handled by Context
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
                                    const fallbackImage = article.og?.image || article.og?.image_url || article.og_image_url || article.image || "https://placehold.co/1200x600/62269E/333333?text=Career+Vedha";
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
                                
                                {/* Render YouTube Video if available */}
                                {article.youtube_url && (() => {
                                    const getYouTubeEmbedUrl = (url) => {
                                        if (!url) return null;
                                        let videoId = '';
                                        try {
                                            if (url.includes('youtu.be/')) {
                                                videoId = url.split('youtu.be/')[1].split('?')[0];
                                            } else if (url.includes('youtube.com/watch')) {
                                                const urlObj = new URL(url);
                                                videoId = urlObj.searchParams.get('v');
                                            } else if (url.includes('youtube.com/live/')) {
                                                videoId = url.split('youtube.com/live/')[1].split('?')[0];
                                            } else if (url.includes('youtube.com/shorts/')) {
                                                videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
                                            } else if (url.includes('youtube.com/embed/')) {
                                                 return url;
                                            }
                                        } catch (e) {
                                            return null;
                                        }
                                        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
                                    };
                                    const embedUrl = getYouTubeEmbedUrl(article.youtube_url);
                                    if (!embedUrl) return null;
                                    return (
                                        <div className="article-youtube-video" style={{ marginTop: '30px', marginBottom: '20px' }}>
                                            <iframe
                                                width="100%"
                                                height="450"
                                                src={embedUrl}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                style={{ borderRadius: '12px', border: 'none' }}
                                            ></iframe>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Related Discovery Hub immediately after content */}
                            {searchContext && (
                                <div className="article-inline-discovery">
                                    <ContentHubWidget 
                                        searchQuery={searchContext} 
                                        title={activeLanguage === 'telugu' ? `${searchContext} కి సంబంధించినవి` : `Related to ${searchContext}`}
                                        minimal={true}
                                    />
                                </div>
                            )}

                            <div className="article-footer-tags">
                                {article.tags && (Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag, idx) => {
                                    const tagText = typeof tag === 'string' ? tag.trim() : (tag.name || String(tag));
                                    if (!tagText) return null;
                                    return <span key={idx} className="tag-badge">#{tagText}</span>;
                                })}
                            </div>
                        </div>
                        <Sidebar 
                            tags={article.tags || article.keywords} 
                            currentId={article.id} 
                            section={section}
                            slug={slug}
                        />
                    </div>
                </div>


                {/* Full Width Recommended Discovery Section */}
                <div className="article-discovery-section bg-light">
                    <div className="container-fluid px-4">
                        <ContentHubWidget 
                            searchQuery="Trending" 
                            title="Other Articles You Might Like"
                            minimal={true}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ArticleDetail;
