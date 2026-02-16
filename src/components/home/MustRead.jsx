import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslations } from '../../utils/translations';
import { newsService } from '../../services';

const MustRead = ({ activeLanguage = 'telugu', articles: propArticles }) => {
    const t = getTranslations(activeLanguage);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch MUST_READ articles using the TOP feature list as requested
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                // Determine language code (backend expects 'te' or 'en')
                const lang = activeLanguage === 'telugu' ? 'te' : 'en';
                
                // Fetch from the features API with TOP type as requested
                // This gives us the pinned articles with article_title and article_slug
                const response = await newsService.getPinnedArticles({ 
                    feature_type: 'TOP', 
                    lang: lang 
                });

                if (Array.isArray(response) && response.length > 0) {
                    setArticles(response);
                } else if (propArticles && propArticles.length > 0) {
                    // Fallback to propArticles if available
                    setArticles(propArticles);
                }
            } catch (error) {
                console.warn('[MustRead] Failed to fetch featured articles:', error);
                if (propArticles && propArticles.length > 0) {
                    setArticles(propArticles);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [activeLanguage, propArticles]);

    useEffect(() => {
        if (articles.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [articles.length]);

    if (loading || articles.length === 0) return null;

    const item = articles[currentIndex];

    // Normalize keys (handle both Article object and Feature object from results)
    const title = item.article_title || item.title;
    const slug = item.article_slug || item.slug;
    // article_section comes from modified backend, section comes from query
    const section = item.article_section || item.section || 'news';

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
                            key={item.feature_id || item.id || currentIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {slug ? (
                                <Link to={`/article/${section}/${slug}`} className="must-read-item">
                                    <span className="ticket-tag">{section === 'null' || !section ? 'News' : section}</span>
                                    <p>{title}</p>
                                </Link>
                            ) : (
                                <div className="must-read-item">
                                    <span className="ticket-tag">{section || 'Update'}</span>
                                    <p>{title}</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MustRead;