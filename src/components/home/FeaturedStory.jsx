import React, { useState, useEffect } from 'react';
import { mockFeaturedStory } from '../../utils/mockData';
// import { newsService } from '../../services';

const FeaturedStory = ({ story, loading, activeLanguage }) => {
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
        return <div className="featured-story loading">Loading...</div>;
    }

    if (!story) return null;

    return (
        <article className="featured-story">
            <img
                src={story.og_image_url || "https://placehold.co/800x450/FFC107/333333?text=Featured+Story"}
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
                <a href={`/article/${story.section || 'general'}/${story.slug}`} className="read-more">
                    Read Full Story <i className="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    );
};

export default FeaturedStory;
