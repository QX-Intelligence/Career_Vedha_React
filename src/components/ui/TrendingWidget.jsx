import React, { useState, useEffect } from 'react';
import { newsService } from '../../services';
import { Link } from 'react-router-dom';

const TrendingWidget = () => {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const lang = localStorage.getItem('preferredLanguage') || 'telugu';

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const data = await newsService.getTrendingArticles({ limit: 5, lang });
                setTrending(data.results || []);
            } catch (error) {
                console.error('Error fetching trending articles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, [lang]);

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
                        <Link to={`/${article.section}/${article.slug}`}>
                            <div className="trending-item">
                                <span className="trending-rank">0{index + 1}</span>
                                <div className="trending-content">
                                    <span className="trending-title">{article.title || article.summary}</span>
                                    <div className="trending-meta">
                                        <i className="far fa-eye"></i> {article.views_count} views
                                    </div>
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
