import React from 'react';
import { useTrendingArticles } from '../../hooks/useHomeContent';
import { Link } from 'react-router-dom';

const TrendingWidget = () => {
    const lang = localStorage.getItem('preferredLanguage') || 'english';
    const { data: trending = [], isLoading: loading } = useTrendingArticles(5, lang);

    if (loading) {
        return (
            <div className="sidebar-widget">
                <div className="widget-loader">
                    <i className="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        );
    }

    if (trending.length === 0) return null;

    return (
        <div className="sidebar-widget trending-widget section-fade-in">
            <h3 className="widget-title">
                <i className="fas fa-fire" style={{ color: 'var(--cv-primary)', marginRight: '8px' }}></i>
                Trending Stories
            </h3>
            <div className="sidebar-compact-list">
                {trending.map((article, index) => (
                    <Link to={`/article/${article.section}/${article.slug}`} key={article.id} className="sidebar-trending-item">
                        <div className="trending-rank-index">0{index + 1}</div>
                        <div className="trending-thumb">
                            <img 
                                src={article.image_url || article.featured_media?.url || "https://placehold.co/120x120/f1f5f9/94a3b8?text=CV"} 
                                alt={article.title} 
                            />
                        </div>
                        <div className="trending-info">
                            <h4 className="trending-item-title">{article.title || article.summary}</h4>
                            <span className="trending-item-meta">
                                <i className="fas fa-arrow-trend-up"></i> {article.section}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default TrendingWidget;
