import React from 'react';
import { useTrendingArticles } from '../../hooks/useHomeContent';
import { Link } from 'react-router-dom';

const TrendingWidget = () => {
    const lang = localStorage.getItem('preferredLanguage') || 'telugu';
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
                <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                Trending Stories
            </h3>
            <ul className="latest-updates">
                {trending.map((article, index) => (
                    <li key={article.id}>
                        <Link to={`/article/${article.section}/${article.slug}`}>
                            <div className="trending-item">
                                <span className="trending-rank">0{index + 1}</span>
                                <div className="trending-content">
                                    <span className="trending-title">{article.title || article.summary}</span>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrendingWidget;
