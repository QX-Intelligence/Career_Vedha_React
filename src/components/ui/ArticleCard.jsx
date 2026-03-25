import React from 'react';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api.config';

/**
 * ArticleCard component
 * 
 * @param {Object} article - The article data
 * @param {String} activeLanguage - Current language ('english' or 'telugu')
 * @param {Function} formatDate - Function to format the date
 * @param {Object} t - Translation object containing 'readMore' key
 * @param {String} customPath - Optional custom path for navigation (e.g. for Exams)
 */
const ArticleCard = ({ article, activeLanguage, formatDate, t, customPath }) => {
    const navigate = useNavigate();

    // Resolve image URL
    let imageUrl = article.featured_media?.url || article.og_image_url;
    if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${API_CONFIG.DJANGO_BASE_URL.replace('/api', '')}${imageUrl}`;
    }
    
    // Set fallback image with section name as text
    const sectionName = article.section || 'Academic';
    const fallbackImage = `https://placehold.co/600x400/FFC107/333333?text=${encodeURIComponent(sectionName)}`;
    imageUrl = imageUrl || fallbackImage;

    // Resolve navigation path
    // Higher priority to customPath, then specific exam logic, then default pattern
    let path = customPath;
    if (!path) {
        if (article.section?.toLowerCase() === 'exams') {
            path = `/article/exams/${article.slug}`;
        } else {
            const sectionSlug = article.section?.toLowerCase() || 'news';
            path = `/article/${sectionSlug}/${article.slug}`;
        }
    }

    const handleNavigation = (e) => {
        // Prevent default if it's inside a nested element that might have its own logic
        if (e) e.preventDefault();
        navigate(path);
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        handleNavigation();
    };

    const displayDate = formatDate ? formatDate(article.published_at || article.created_at) : 'Recent';

    return (
        <article 
            className="article-card" 
            onClick={() => handleNavigation()}
            style={{ cursor: 'pointer' }}
        >
            <div className="article-card-image">
                <img
                    src={imageUrl}
                    alt={article.title}
                    onError={(e) => {
                        e.target.src = fallbackImage;
                    }}
                />
                <div className="article-card-badge">
                    {article.section || 'General'}
                </div>
            </div>
            <div className="article-card-content">
                <h3 className="news-title">{article.title}</h3>
                <p className="news-description">
                    {article.summary || article.title}
                </p>
                <div className="news-card-footer">
                    <div className="news-date">
                        <i className="far fa-clock"></i>
                        {displayDate}
                    </div>
                    <button 
                        className="read-more-btn" 
                        onClick={handleButtonClick}
                        style={{ border: 'none', cursor: 'pointer' }}
                        aria-label={`Read more about ${article.title}`}
                    >
                        {t?.readMore || 'Read More'} <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ArticleCard;
