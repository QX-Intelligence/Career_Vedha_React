import React, { useState, useEffect } from 'react';
import { mockBreakingNews } from '../../utils/mockData';

const BreakingNews = ({ data }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const newsItems = data && data.length > 0 ? data : mockBreakingNews;

    useEffect(() => {
        if (newsItems.length <= 1) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % newsItems.length);
                setIsAnimating(false);
            }, 1200);
        }, 6000);
        return () => clearInterval(interval);
    }, [newsItems.length]);

    const getNewsContent = (item) => {
        if (typeof item === 'string') return item;
        return item.title || 'Latest Updates';
    };

    const getNewsLink = (item) => {
        if (typeof item === 'string') return '#';
        return item.slug ? `/article/${item.slug}` : '#';
    };

    if (!newsItems || newsItems.length === 0) return null;

    return (
        <div className="breaking-news">
            <div className="news-container">
                <div className="news-ticker slide-mode">
                    <div className="must-read-label">
                        <i className="fas fa-bolt"></i> Must Read
                    </div>
                    <div className="current-news-item-wrapper">
                        <div key={currentIndex} className="news-slide-item slide-in-right">
                            <a href={getNewsLink(newsItems[currentIndex])}>
                                {getNewsContent(newsItems[currentIndex])}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakingNews;
