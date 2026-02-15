import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslations } from '../../utils/translations';
import { currentAffairsService } from '../../services';

const MustRead = ({ activeLanguage = 'telugu' }) => {
    const t = getTranslations(activeLanguage);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const lang = activeLanguage === 'telugu' ? 'TE' : 'EN';
                const data = await currentAffairsService.getAllAffairs({ language: lang, limit: 5 });
                if (Array.isArray(data) && data.length > 0) {
                    setArticles(data);
                }
            } catch (error) {
                console.error('Failed to fetch must-read articles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [activeLanguage]);

    useEffect(() => {
        if (articles.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [articles.length]);

    if (loading || articles.length === 0) return null;

    const currentArticle = articles[currentIndex];

    return (
        <div className="must-read-section container">
            <div className="must-read-wrapper">
                <div className="must-read-brand-label">
                    <div className="indicator"></div>
                    <h3>{t.mustRead}</h3>
                    <i className="fas fa-bolt must-read-icon"></i>
                </div>

                <div className="must-read-ticker-container">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            className="ticker-item-wrapper" 
                            key={currentArticle.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <a href={currentArticle.fileUrl} target="_blank" rel="noopener noreferrer" className="must-read-item">
                                <span className="ticket-tag">{currentArticle.region}</span>
                                <p>{currentArticle.title}</p>
                            </a>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MustRead;