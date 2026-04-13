import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { globalSearchService, newsService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';

const RelatedWidget = ({ tags, currentId, section, slug }) => {
    const { activeLanguage } = useLanguage();
    const [relatedContent, setRelatedContent] = useState({
        articles: [],
        jobs: [],
        currentAffairs: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            // Priority: Dedicated Related Articles API if section and slug are present
            if (section && slug) {
                setLoading(true);
                try {
                    const response = await newsService.getRelatedArticles(section, slug, activeLanguage);
                    // The backend returns { results: [...] }
                    setRelatedContent(prev => ({
                        ...prev,
                        articles: (response.results || []).slice(0, 5).map(a => ({
                            ...a,
                            url: a.url || `/article/${a.section || section}/${a.slug}`
                        }))
                    }));
                    
                    // Also fetch some jobs/current affairs based on tags as fallback for those sections
                    const tagList = Array.isArray(tags) ? tags : (tags || '').split(',');
                    const searchQuery = tagList.slice(0, 1).map(t => t.trim()).join(' ');
                    if (searchQuery) {
                        const searchResponse = await globalSearchService.searchAll(searchQuery, ['jobs', 'currentAffairs']);
                        setRelatedContent(prev => ({
                            ...prev,
                            jobs: (searchResponse.results || []).filter(item => item.type === 'job').slice(0, 5),
                            currentAffairs: (searchResponse.results || []).filter(item => item.type === 'currentAffair').slice(0, 5)
                        }));
                    }
                    return;
                } catch (error) {
                    console.error('Error fetching dedicated related articles:', error);
                    // Fallback to global search on error
                } finally {
                    setLoading(false);
                }
            }

            // Fallback: Global search based on tags
            if (!tags || tags.length === 0) {
                setLoading(false);
                return;
            }

            const tagList = Array.isArray(tags) ? tags : (tags || '').split(',');
            const searchQuery = tagList.slice(0, 2).map(t => t.trim()).join(' ');

            if (!searchQuery) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await globalSearchService.searchAll(searchQuery, ['article', 'jobs', 'currentAffairs']);
                
                const articles = (response.results || [])
                    .filter(item => item.type === 'article' && String(item.id) !== String(currentId))
                    .slice(0, 5);
                
                const jobs = (response.results || [])
                    .filter(item => item.type === 'job')
                    .slice(0, 5);

                const currentAffairs = (response.results || [])
                    .filter(item => item.type === 'currentAffair')
                    .slice(0, 5);

                setRelatedContent({ articles, jobs, currentAffairs });
            } catch (error) {
                console.error('Error fetching related content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [tags, currentId, section, slug]);

    if (loading) {
        return (
            <div className="sidebar-widget">
                <div className="widget-loader">
                    <i className="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        );
    }

    const hasContent = relatedContent.articles.length > 0 || 
                       relatedContent.jobs.length > 0 || 
                       relatedContent.currentAffairs.length > 0;

    if (!hasContent) return null;

    return (
        <div className="related-widgets-container">
            {relatedContent.articles.length > 0 && (
                <div className="sidebar-widget related-stories-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-newspaper" style={{ color: 'var(--primary-yellow)', marginRight: '8px' }}></i>
                        Related Stories
                    </h3>
                    <div className="sidebar-compact-list">
                        {relatedContent.articles.map((item) => (
                            <Link to={item.url} key={`rel-art-${item.id}`} className="sidebar-compact-item">
                                <div className="compact-thumb">
                                    <img src={item.image || "https://placehold.co/120x120/f8fafc/cbd5e1?text=CV"} alt={item.title} />
                                </div>
                                <div className="compact-info">
                                    <h4 className="compact-title">{item.title}</h4>
                                    <span className="compact-meta">
                                        {item.publishedAt && !isNaN(Date.parse(item.publishedAt)) 
                                            ? new Date(item.publishedAt).toLocaleDateString() 
                                            : (item.section || 'Latest')}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {relatedContent.jobs.length > 0 && (
                <div className="sidebar-widget related-jobs-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-briefcase" style={{ color: 'var(--primary-yellow)', marginRight: '8px' }}></i>
                        Career Opportunities
                    </h3>
                    <div className="sidebar-compact-list">
                        {relatedContent.jobs.map((item) => (
                            <Link to={item.url} key={`rel-job-${item.id}`} className="sidebar-compact-item">
                                <div className="compact-icon-box"><i className="fas fa-building" style={{ color: 'var(--primary-yellow)' }}></i></div>
                                <div className="compact-info">
                                    <h4 className="compact-title">{item.title}</h4>
                                    <span className="compact-meta">{item.company}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {relatedContent.currentAffairs.length > 0 && (
                <div className="sidebar-widget related-affairs-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-calendar-alt" style={{ color: 'var(--cv-primary)', marginRight: '8px' }}></i>
                        Current Affairs
                    </h3>
                    <div className="sidebar-compact-list">
                        {relatedContent.currentAffairs.map((item) => (
                            <Link to={item.url} key={`rel-ca-${item.id}`} className="sidebar-compact-item">
                                <div className="compact-icon-box"><i className="fas fa-globe" style={{ color: 'var(--cv-primary)' }}></i></div>
                                <div className="compact-info">
                                    <h4 className="compact-title">{item.title}</h4>
                                    <span className="compact-meta">{item.language === 'te' ? 'Telugu' : 'English'} Special</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelatedWidget;
