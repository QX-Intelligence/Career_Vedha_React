import React, { useState, useEffect } from 'react';
import { mockSecondaryStories } from '../../utils/mockData';
// import { newsService } from '../../services';

const SecondaryStories = () => {
    const [stories, setStories] = useState(mockSecondaryStories);

    useEffect(() => {
        // When backend is ready, uncomment this:
        // fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            // const response = await newsService.getLatestNews(4);
            // setStories(response.data);
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    return (
        <div className="secondary-stories">
            {stories.map((story) => (
                <article key={story.id} className="story-item">
                    <img src={story.image} alt={story.title} />
                    <div className="story-info">
                        <h3>{story.title}</h3>
                        <p className="story-meta">
                            <i className="far fa-clock"></i> {story.publishedAt}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
};

export default SecondaryStories;
