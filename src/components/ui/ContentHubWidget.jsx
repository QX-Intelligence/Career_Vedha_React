import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { globalSearchService, newsService } from '../../services'; // Added newsService import
import { useLanguage } from '../../context/LanguageContext';
import './ContentHubWidget.css';

const ContentHubWidget = ({ searchQuery, title, minimal = false }) => { // Added minimal prop with default false
    const { activeLanguage } = useLanguage();
    const [data, setData] = useState({
        articles: [],
        jobs: [],
        academics: [],
        estore: [],
        currentAffairs: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHubData = async () => {
            if (!searchQuery) return; // Simplified, setLoading(false) will be handled by finally block
            
            setLoading(true);
            try {
                let results = [];
                
                // If the query is a generic discovery trigger, fetch trending/latest directly
                const isGeneric = ['Trending', 'Latest', 'Discover', 'Recommended'].includes(searchQuery);
                
                if (isGeneric) {
                    const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
                    const [trendingRes, latestArticles] = await Promise.all([
                        newsService.getTrendingArticles({ limit: 8, lang: activeLanguage }),
                        newsService.getLatestArticles(langCode, 8) // Fallback to latest as well
                    ]);
                    
                    const trending = (trendingRes.results || []).map(a => ({
                        type: 'article',
                        id: a.id,
                        title: a.title,
                        summary: a.summary,
                        image: a.image_url || a.featured_media?.url,
                        url: `/article/${a.section}/${a.slug}`,
                        section: a.section,
                        publishedAt: a.published_at,
                        isTrending: true
                    }));
                    
                    const latest = (latestArticles || []).map(a => ({
                        type: 'article',
                        id: a.id,
                        title: a.title,
                        summary: a.summary,
                        image: a.image_url || a.featured_media?.url,
                        url: `/article/${a.section}/${a.slug}`,
                        section: a.section,
                        publishedAt: a.published_at
                    }));

                    // Combine and remove duplicates
                    results = [...trending];
                    const existingIds = new Set(results.map(r => r.id));
                    latest.forEach(item => {
                        if (!existingIds.has(item.id)) results.push(item);
                    });
                } else {
                    // Regular targeted search for specific context (e.g. 10th Class)
                    const response = await globalSearchService.searchAll(searchQuery, ['all'], activeLanguage);
                    results = response.results || [];

                    // Fallback: If results are too thin, add trending
                    if (results.filter(r => r.type === 'article').length < 4) { // Changed limit from 2 to 4
                        const trendingRes = await newsService.getTrendingArticles({ limit: 4, lang: activeLanguage }); // Changed limit from 10 to 4
                        const trending = (trendingRes.results || []).map(a => ({
                            type: 'article',
                            id: a.id,
                            title: a.title,
                            summary: a.summary, // Added summary
                            image: a.image_url || a.featured_media?.url,
                            url: `/article/${a.section}/${a.slug}`,
                            section: a.section,
                            publishedAt: a.published_at,
                            isTrending: true
                        }));
                        results = [...results, ...trending];
                    }
                }
                
                // Group by type with high density limits
                setData({
                    articles: results.filter(r => r.type === 'article').slice(0, 12), // Increased limit from 8 to 12
                    jobs: results.filter(r => r.type === 'job').slice(0, 8), // Increased limit from 6 to 8
                    academics: results.filter(r => r.type === 'academic').slice(0, 8), // Increased limit from 6 to 8
                    estore: results.filter(r => r.type === 'product').slice(0, 8), // Increased limit from 6 to 8
                    currentAffairs: results.filter(r => r.type === 'currentAffair').slice(0, 8) // Increased limit from 6 to 8
                });
            } catch (error) {
                console.error('Error fetching hub data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHubData();
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="content-hub-skeleton">
                <div className="skeleton-title"></div>
                <div className="skeleton-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
                </div>
            </div>
        );
    }

    const hasContent = Object.values(data).some(arr => arr.length > 0);
    if (!hasContent) return null;

    return (
        <section className={`content-hub-section section-fade-in ${minimal ? 'minimal-mode' : ''}`}>
            {title && (
                <div className="discovery-header">
                    <h2 className="discovery-title">{title}</h2>
                </div>
            )}
            
            <div className="hub-category-block">
                <div className="articles-small-grid">
                    {data.articles.map(item => (
                        <Link to={item.url} key={item.id} className="article-mini-card">
                            <div className="mini-card-thumb">
                                <img src={item.image || "https://placehold.co/200x120/f8fafc/cbd5e1?text=CV"} alt={item.title} />
                                {item.isTrending && <span className="mini-trending-tag"><i className="fas fa-fire"></i></span>}
                            </div>
                            <div className="mini-card-body">
                                <h4 className="mini-card-title">{item.title}</h4>
                                <div className="mini-card-footer">
                                    <span className="mini-section">{item.section}</span>
                                    <span className="mini-date">
                                        {item.publishedAt && !isNaN(Date.parse(item.publishedAt)) 
                                            ? new Date(item.publishedAt).toLocaleDateString() 
                                            : 'Recent'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Hub secondary columns - suppressed in minimal mode for cleaner article discovery */}
            {!minimal && (
                <div className="hub-grid-secondary">
                    {/* Academic Materials */}
                    {data.academics.length > 0 && (
                        <div className="hub-secondary-column academics-hub">
                            <div className="tiny-cards-list">
                                {data.academics.map(item => (
                                    <Link to={item.url} key={item.id} className="tiny-hub-card">
                                        <div className="tiny-icon"><i className="fas fa-file-pdf"></i></div>
                                        <div className="tiny-info">
                                            <span className="tiny-title">{item.title}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Job Opportunities */}
                    {data.jobs.length > 0 && (
                        <div className="hub-secondary-column jobs-hub">
                            <div className="tiny-cards-list">
                                {data.jobs.map(item => (
                                    <Link to={item.url} key={item.id} className="tiny-hub-card">
                                        <div className="tiny-icon"><i className="fas fa-building"></i></div>
                                        <div className="tiny-info">
                                            <span className="tiny-title">{item.title}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ContentHubWidget;
