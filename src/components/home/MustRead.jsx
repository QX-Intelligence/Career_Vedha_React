import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MustRead = () => {
    const articles = [
        { id: 1, title: 'AP Inter Exam Dates Released 2026', tag: 'Exams', slug: 'ap-inter-exam-dates-2026' },
        { id: 2, title: 'Group-2 Mains Postponed - Check Details', tag: 'Notifications', slug: 'group-2-mains-postponed' },
        { id: 3, title: 'TS DSC 2026 Notification Expected Soon', tag: 'Jobs', slug: 'ts-dsc-2026-notification' },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [articles.length]);

    const currentArticle = articles[currentIndex];

    return (
        <div className="must-read-section container">
            <div className="must-read-wrapper">
                <div className="must-read-brand-label">
                    <div className="indicator"></div>
                    <h3>MUST READ</h3>
                    <i className="fas fa-bolt must-read-icon"></i>
                </div>

                <div className="must-read-ticker-container">
                    <div className="ticker-item-wrapper" key={currentArticle.id}>
                        <Link to={`/article/${currentArticle.slug}`} className="must-read-item">
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