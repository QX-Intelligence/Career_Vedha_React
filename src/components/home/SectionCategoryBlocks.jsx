import React, { useState, useEffect } from 'react';
import { newsService } from '../../services';
import { Link } from 'react-router-dom';

const SectionCategoryBlocks = ({ section, title }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const lang = localStorage.getItem('preferredLanguage') || 'telugu';

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const data = await newsService.getCategoryBlocks(section, lang);
                setBlocks(data.blocks || []);
            } catch (error) {
                console.error(`Error fetching category blocks for ${section}:`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlocks();
    }, [section, lang]);

    if (loading) {
        return (
            <div className="category-blocks-loading container">
                <i className="fas fa-spinner fa-spin"></i>
            </div>
        );
    }

    if (blocks.length === 0) return null;

    return (
        <section className="category-blocks-section container">
            <h2 className="section-main-title">{title}</h2>
            <div className="blocks-grid">
                {blocks.map((block) => (
                    <div key={block.category.id} className="category-block">
                        <div className="block-header">
                            <h3>{block.category.name}</h3>
                            <Link to={`/category/${block.category.slug}`} className="see-more">
                                See All <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                        <div className="block-articles">
                            {block.results.map((article) => (
                                <Link key={article.id} to={`/article/${article.section}/${article.slug}`} className="block-article-item">
                                    <div className="item-img">
                                        <img src={article.og_image_url || "https://placehold.co/100x100/333/fff?text=VEDHA"} alt={article.title} />
                                    </div>
                                    <div className="item-content">
                                        <h4>{article.title}</h4>
                                        <span className="item-date">{new Date(article.published_at).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SectionCategoryBlocks;
