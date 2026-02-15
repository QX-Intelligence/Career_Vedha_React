import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../ui/Skeleton';

const FeaturedStory = memo(({ story, loading, activeLanguage }) => {
    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Recent';
        try {
            const date = new Date(dateString);
            const locale = activeLanguage === 'telugu' ? 'te-IN' : 'en-IN';
            return date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recent';
        }
    };

    if (loading) {
        return (
            <div className="featured-story loading-skeleton">
                <Skeleton variant="card" height="450px" />
                <div className="story-content" style={{ marginTop: '1rem' }}>
                    <Skeleton variant="text" width="20%" style={{ marginBottom: '0.5rem' }} />
                    <Skeleton variant="title" width="80%" style={{ marginBottom: '1rem' }} />
                    <Skeleton variant="text" count={2} />
                </div>
            </div>
        );
    }

    if (!story) return null;

    return (
        <article className="featured-story">
            <img
                src={story.featured_media?.url || story.og_image_url || "https://placehold.co/800x450/FFC107/333333?text=Featured+Story"}
                alt={story.title}
                onError={(e) => {
                    e.target.src = "https://placehold.co/800x450/FFC107/333333?text=Featured+Story";
                }}
            />
            <div className="story-content">
                <span className="category-badge">{story.section || 'General'}</span>
                <h2>{story.title}</h2>
                <p className="story-meta">
                    <span><i className="far fa-clock"></i> {formatDate(story.published_at || story.created_at)}</span>
                    <span><i className="far fa-user"></i> Admin</span>
                </p>
                <p className="story-excerpt">{story.summary || story.title}</p>
                <Link to={`/article/${story.section || 'general'}/${story.slug}`} className="story-link">
                    <h3>{story.title}</h3>
                </Link>
            </div>
        </article>
    );
});

export default FeaturedStory;
