import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MustRead = () => {
    const articles = [
        { id: 1, title: 'AP Inter Exam Dates Released 2026', tag: 'Exams' },
        { id: 2, title: 'Group-2 Mains Postponed - Check Details', tag: 'Notifications' },
        { id: 3, title: 'TS DSC 2026 Notification Expected Soon', tag: 'Jobs' },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
        }, 5000); // 5 seconds per item

        return () => clearInterval(interval);
    }, [articles.length]);

    const currentArticle = articles[currentIndex];

    return (
        <div className="must-read-section container">
            <div className="must-read-wrapper">
                <div className="must-read-label">
                    <span className="indicator"></span>
                    <h3>Must Read</h3>
                    <i className="fas fa-bolt must-read-icon"></i>
                </div>
                <div className="must-read-ticker-container">
                    {/* The key is crucial for triggering the animation on change */}
                    <div key={currentArticle.id} className="ticker-item-wrapper">
                        <Link to="#" className="must-read-item">
                            <span className="ticket-tag">{currentArticle.tag}</span>
                            <p>{currentArticle.title}</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MustRead;
