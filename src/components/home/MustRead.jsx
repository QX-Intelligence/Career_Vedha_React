import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslations } from '../../utils/translations';
import { newsService } from '../../services';

const MustRead = ({ activeLanguage = 'telugu', articles: propArticles }) => {
    const t = getTranslations(activeLanguage);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef(null);

    // Fetch MUST_READ articles using the TOP feature list
    useEffect(() => {
        let cancelled = false;

        const fetchArticles = async () => {
            try {
                const lang = activeLanguage === 'telugu' ? 'te' : 'en';

                // Fetch from the features API with TOP type
                const response = await newsService.getPinnedArticles({ 
                    feature_type: 'TOP', 
                    lang: lang 
                });

                if (cancelled) return;

                // Combine API results with propArticles, deduplicate by id
                const apiArticles = Array.isArray(response) ? response : [];
                const fallbackArticles = Array.isArray(propArticles) ? propArticles : [];
                
                // Merge: API articles first, then propArticles that aren't already in API results
                const combined = [...apiArticles];
                const existingIds = new Set(apiArticles.map(a => a.article_id || a.id));
                
                fallbackArticles.forEach(article => {
                    const artId = article.article_id || article.id;
                    if (artId && !existingIds.has(artId)) {
                        combined.push(article);
                        existingIds.add(artId);
                    }
                });

                if (combined.length > 0) {
                    setArticles(combined);
                } else if (fallbackArticles.length > 0) {
                    setArticles(fallbackArticles);
                }
            } catch (error) {
                if (cancelled) return;
                console.warn('[MustRead] Failed to fetch featured articles:', error);
                if (propArticles && propArticles.length > 0) {
                    setArticles(propArticles);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchArticles();
        return () => { cancelled = true; };
    }, [activeLanguage]);

    // Update articles when propArticles changes (without re-fetching)
    useEffect(() => {
        if (propArticles && propArticles.length > 0 && articles.length === 0 && !loading) {
            setArticles(propArticles);
        }
    }, [propArticles, articles.length, loading]);

    // Reset currentIndex when articles list changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [articles.length]);

    // Auto-rotate through all articles, loop back to first
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (articles.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % articles.length);
        }, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [articles.length]);

    if (loading || articles.length === 0) return null;

    const item = articles[currentIndex];
    if (!item) return null;

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
                            key={`${item.feature_id || item.id || currentIndex}-${currentIndex}`}
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