import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../ui/Skeleton';
import { useLanguage } from '../../context/LanguageContext';
import { getBestImageUrl } from '../../utils/articleUtils';
import './TopStoriesHero.css';

/* ------------------------------------------------------------------
   TopStoriesHero — Supports new backend format:
   - story.title_en / story.title_te
   - story.description_en / story.description_te
   - story.media[] → { position, media_details: { url, media_type } }
   - story.category_detail → { name, slug }
   - rank-sorted (already handled by backend)
------------------------------------------------------------------ */

const MediaSlide = ({ mediaItem, alt }) => {
    if (!mediaItem) return null;
    if (mediaItem.media_type === 'video') {
        return (
            <video
                src={mediaItem.url}
                className="gallery-media"
                controls
                muted
                playsInline
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }
    return (
        <img
            src={mediaItem.url}
            alt={alt}
            className="gallery-media"
            onError={(e) => { e.target.src = "https://placehold.co/800x450/312e81/a5b4fc?text=Career+Vedha"; }}
        />
    );
};

const TopStoriesHero = ({
    topStories = [],
    latestUpdates = [],
    loading,
    title = "Top Stories",
    latestTitle = "Latest Updates",
    viewAllLink = "/articles",
    onItemClick = null,
    isHomePage = false,
    sidebarBlocks = []
}) => {
    const { activeLanguage } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [gallerySlide, setGallerySlide] = useState(0);
    const galleryTimerRef = useRef(null);

    const isTelugu = activeLanguage === 'telugu';

    // Reset gallery index when main story changes
    useEffect(() => {
        setGallerySlide(0);
    }, [currentSlide]);

    // Auto-scroll story carousel every 5s
    useEffect(() => {
        if (!topStories.length) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % topStories.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [topStories.length]);

    // Auto-scroll gallery within a story every 3s
    useEffect(() => {
        clearInterval(galleryTimerRef.current);
        const story = topStories[currentSlide];
        if (!story?.media?.length) return;
        galleryTimerRef.current = setInterval(() => {
            setGallerySlide(prev => (prev + 1) % story.media.length);
        }, 3000);
        return () => clearInterval(galleryTimerRef.current);
    }, [currentSlide, topStories]);

    const handlePrev = () => setCurrentSlide(prev => (prev === 0 ? topStories.length - 1 : prev - 1));
    const handleNext = () => setCurrentSlide(prev => (prev + 1) % topStories.length);

    // Derive title/description based on language preference
    const getStoryTitle = (story) => {
        if (isTelugu && story.title_te) return story.title_te;
        return story.title_en || story.title || story.headline || 'Untitled';
    };

    const getStoryDesc = (story) => {
        if (isTelugu && story.description_te) return story.description_te;
        return story.description_en || story.description || story.summary || '';
    };

    // Get current media for gallery
    const getGalleryMedia = (story) => {
        if (story.media && story.media.length > 0) {
            const sorted = [...story.media].sort((a, b) => a.position - b.position);
            return sorted.map(m => m.media_details).filter(Boolean);
        }
        
        // Fallback: unified image detection
        const bestUrl = getBestImageUrl(story);
        if (bestUrl) return [{ url: bestUrl, media_type: 'image' }];
        
        return [];
    };

    const renderStoryCard = (story) => {
        const gallery = getGalleryMedia(story);
        const currentMedia = gallery[gallerySlide] || gallery[0];
        const storyTitle = getStoryTitle(story);
        const storyDesc = getStoryDesc(story);
        const categoryName = story.category_detail?.name || story.category || '';
        const storyUrl = (story.slug && story.section) 
            ? `/article/${story.section}/${story.slug}` 
            : (story.category_detail?.slug ? `/articles?category=${story.category_detail.slug}` : null);

        const inner = (
            <>
                <div className="gallery-wrapper" style={{ position: 'relative' }}>
                    <MediaSlide mediaItem={currentMedia} alt={storyTitle} />
                    {/* Gallery dot indicator for multi-media */}
                    {gallery.length > 1 && (
                        <div className="gallery-dots">
                            {gallery.map((_, i) => (
                                <span
                                    key={i}
                                    className={`gallery-dot ${i === gallerySlide ? 'active' : ''}`}
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        setGallerySlide(i); 
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    {gallery.length > 1 && (
                        <div className="gallery-count-badge">
                            <i className="fas fa-images"></i> {gallerySlide + 1}/{gallery.length}
                        </div>
                    )}
                </div>
                <div className="story-info">
                    {categoryName && <span className="story-category-badge">{categoryName}</span>}
                    <h3 style={{ fontFamily: isTelugu ? 'serif' : 'inherit' }}>{storyTitle}</h3>
                    {storyDesc && <p className="story-description">{storyDesc}</p>}
                </div>
            </>
        );

        if (onItemClick) {
            return <div className="story-link" onClick={() => onItemClick(story)} style={{ cursor: 'pointer' }}>{inner}</div>;
        }
        if (storyUrl) {
            return <Link to={storyUrl} className="story-link">{inner}</Link>;
        }
        return <div className="story-link">{inner}</div>;
    };

    if (loading) {
        return (
            <section className="top-stories-hero-section container">
                <div className="top-stories-grid">
                    <div className="top-stories-left">
                        <Skeleton variant="title" width="30%" style={{ marginBottom: '1rem' }} />
                        <Skeleton variant="card" height="400px" />
                    </div>
                    <div className="top-stories-right">
                        <Skeleton variant="title" width="50%" style={{ marginBottom: '1rem' }} />
                        <Skeleton variant="text" count={6} />
                    </div>
                </div>
            </section>
        );
    }

    if (!topStories.length && !sidebarBlocks.length && !latestUpdates.length) {
        return null;
    }

    const currentStory = topStories[currentSlide];

    return (
        <section className="top-stories-hero-section container">
            <div className="top-stories-grid">
                {/* Left: Story Carousel with Gallery */}
                <div className="top-stories-left">
                    <div className="block-header">
                        <h2>{title}</h2>
                    </div>

                    {currentStory ? (
                        <div className="top-stories-carousel">
                            <button className="carousel-control prev" onClick={handlePrev} aria-label="Previous story">
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <div className="carousel-content">
                                {renderStoryCard(currentStory)}
                            </div>
                            <button className="carousel-control next" onClick={handleNext} aria-label="Next story">
                                <i className="fas fa-arrow-right"></i>
                            </button>
                            <div className="carousel-indicators">
                                {topStories.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(index)}
                                    ></span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="no-content">No {title.toLowerCase()} available.</div>
                    )}
                </div>

                {/* Right: Latest / Sidebar Blocks */}
                <div className="top-stories-right">
                    {isHomePage ? (
                        <>
                            <div className="block-header">
                                <h2>{latestTitle}</h2>
                            </div>
                            <div className="latest-updates-list">
                                {latestUpdates.slice(0, 5).map((update) => (
                                    <div className="update-item" key={update.id}>
                                        {onItemClick ? (
                                            <span onClick={() => onItemClick(update)} style={{ cursor: 'pointer' }}>
                                                {getStoryTitle(update)}
                                            </span>
                                        ) : (
                                            <Link to={`/article/${update.section || 'news'}/${update.slug}`}>
                                                {getStoryTitle(update)}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="view-all-wrapper">
                                <Link to={viewAllLink} className="view-all-link">View All &gt;&gt;</Link>
                            </div>
                        </>
                    ) : (
                        <div className="sidebar-blocks-wrapper">
                            {sidebarBlocks.map((block, bIdx) => (
                                <div key={bIdx} className="sidebar-block">
                                    <div className="block-header">
                                        <h2>{block.title}</h2>
                                    </div>
                                    <div className="latest-updates-list">
                                        {block.items.slice(0, 3).map((item) => (
                                            <div className="update-item" key={item.id}>
                                                {onItemClick ? (
                                                    <span onClick={() => onItemClick(item)} style={{ cursor: 'pointer' }}>
                                                        {getStoryTitle(item)}
                                                    </span>
                                                ) : (
                                                    <Link to={`/article/${item.section || 'news'}/${item.slug}`}>
                                                        {getStoryTitle(item)}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {block.viewAllLink && (
                                        <div className="view-all-wrapper" style={{ marginBottom: '1rem' }}>
                                            <Link to={block.viewAllLink} className="view-all-link">View All &gt;&gt;</Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TopStoriesHero;
