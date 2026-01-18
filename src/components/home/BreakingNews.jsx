import React, { useState, useEffect } from 'react';
import { mockBreakingNews } from '../../utils/mockData';

const BreakingNews = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const newsItems = mockBreakingNews;

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % newsItems.length);
                setIsAnimating(false);
            }, 1200); // Match new longer animation duration
        }, 6000); // Even slower reading time (6s)
        return () => clearInterval(interval);
    }, [newsItems.length]);

    return (
        <div className="breaking-news">
            <div className="news-container">
                <div className="news-ticker slide-mode">
                    <div className="must-read-label">
                        <i className="fas fa-bolt"></i> Must Read
                    </div>
                    <div className="current-news-item-wrapper">
                        <div key={currentIndex} className="news-slide-item slide-in-right">
                            <a href="#">{newsItems[currentIndex]}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakingNews;
