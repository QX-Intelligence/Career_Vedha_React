import React, { useState, useEffect } from 'react';
import { mockFeaturedStory } from '../../utils/mockData';
// import { newsService } from '../../services';

const FeaturedStory = () => {
    const [story, setStory] = useState(mockFeaturedStory);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // When backend is ready, uncomment this:
        // fetchFeaturedStory();
    }, []);

    const fetchFeaturedStory = async () => {
        setLoading(true);
        try {
            // const response = await newsService.getFeaturedNews();
            // setStory(response.data);
        } catch (error) {
            console.error('Error fetching featured story:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <article className="featured-story">
            <img src={story.image} alt={story.title} />
            <div className="story-content">
                <span className="category-badge">{story.category}</span>
                <h2>{story.title}</h2>
                <p className="story-meta">
                    <span><i className="far fa-clock"></i> {story.publishedAt}</span>
                    <span><i className="far fa-user"></i> {story.author}</span>
                </p>
                <p className="story-excerpt">{story.excerpt}</p>
                <a href="#" className="read-more">
                    Read Full Story <i className="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    );
};

export default FeaturedStory;
