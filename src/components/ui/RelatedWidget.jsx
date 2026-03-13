import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { globalSearchService, newsService } from '../../services';

const RelatedWidget = ({ tags, currentId, section, slug }) => {
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
                    const response = await newsService.getRelatedArticles(section, slug);
                    // The backend returns { results: [...] }
                    setRelatedContent(prev => ({
                        ...prev,
                        articles: (response.results || []).slice(0, 5)
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

            const tagList = Array.isArray(tags) ? tags : tags.split(',');
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
                <div className="sidebar-widget related-articles-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-newspaper" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                        Related Articles
                    </h3>
                    <ul className="latest-updates">
                        {relatedContent.articles.map((item) => (
                            <li key={`rel-art-${item.id}`}>
                                <Link to={item.url} className="trending-item">
                                    <div className="trending-content">
                                        <span className="trending-title">{item.title}</span>
                                        {item.publishedAt && (
                                            <span className="trending-meta">
                                                <i className="far fa-calendar"></i> {new Date(item.publishedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="widget-footer" style={{ textAlign: 'right', marginTop: '12px' }}>
                        <Link to="/articles" className="view-link" style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6' }}>
                            View all <i className="fas fa-angle-double-right"></i>
                        </Link>
                    </div>
                </div>
            )}

            {relatedContent.jobs.length > 0 && (
                <div className="sidebar-widget related-jobs-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-briefcase" style={{ color: '#10b981', marginRight: '8px' }}></i>
                        Career Opportunities
                    </h3>
                    <ul className="latest-updates">
                        {relatedContent.jobs.map((item) => (
                            <li key={`rel-job-${item.id}`}>
                                <Link to={item.url} className="trending-item">
                                    <div className="trending-content">
                                        <span className="trending-title">{item.title}</span>
                                        <span className="trending-meta">
                                            <i className="fas fa-building"></i> {item.company}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="widget-footer" style={{ textAlign: 'right', marginTop: '12px' }}>
                        <Link to="/jobs" className="view-link" style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>
                            View all <i className="fas fa-angle-double-right"></i>
                        </Link>
                    </div>
                </div>
            )}

            {relatedContent.currentAffairs.length > 0 && (
                <div className="sidebar-widget related-affairs-widget section-fade-in">
                    <h3 className="widget-title">
                        <i className="fas fa-calendar-alt" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                        Current Affairs
                    </h3>
                    <ul className="latest-updates">
                        {relatedContent.currentAffairs.map((item) => (
                            <li key={`rel-ca-${item.id}`}>
                                <Link to={item.url} className="trending-item">
                                    <div className="trending-content">
                                        <span className="trending-title">{item.title}</span>
                                        <span className="trending-meta">
                                            {item.language === 'te' ? 'Telugu' : 'English'}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="widget-footer" style={{ textAlign: 'right', marginTop: '12px' }}>
                        <Link to="/current-affairs" className="view-link" style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                            View all <i className="fas fa-angle-double-right"></i>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelatedWidget;
