import React, { useState, useEffect } from 'react';
import { mockSecondaryStories } from '../../utils/mockData';
// import { newsService } from '../../services';

const SecondaryStories = ({ stories, loading, activeLanguage }) => {
    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Recent';
        try {
            const date = new Date(dateString);
            const locale = activeLanguage === 'telugu' ? 'te-IN' : 'en-IN';
            return date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short'
            });
        } catch (e) {
            return 'Recent';
        }
    };

    if (loading) {
        return (
            <div className="secondary-stories loading">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="story-item skeleton"></div>
                ))}
            </div>
        );
    }

    if (!stories || stories.length === 0) return null;

    return (
        <div className="secondary-stories">
            {stories.map((story) => (
                <article key={story.id} className="story-item">
                    <img
                        src={story.og_image_url || "https://placehold.co/200x120/FFC107/333333?text=Story"}
                        alt={story.title}
                        onError={(e) => {
                            e.target.src = "https://placehold.co/200x120/FFC107/333333?text=Story";
                        }}
                    />
                    <div className="story-info">
                        <a href={`/article/${story.section || 'general'}/${story.slug}`} className="story-link">
                            <h3>{story.title}</h3>
                        </a>
                        <p className="story-meta">
                            <i className="far fa-clock"></i> {formatDate(story.published_at || story.created_at)}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
};

export default SecondaryStories;
