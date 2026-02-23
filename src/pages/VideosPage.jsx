import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { youtubeService } from '../services';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import Skeleton from '../components/ui/Skeleton';
import VideoPlayerModal from '../components/ui/VideoPlayerModal';
import '../styles/VideosPage.css';

const VideosPage = () => {
    const { category } = useParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [activeLanguage, setActiveLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'english');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const cursorIdRef = useRef(null);

    const videoCategory = category === 'shorts' ? 'SHORT' : 'LONG';

    const fetchVideos = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setLoading(true);
            cursorIdRef.current = null;
        } else {
            setLoadingMore(true);
        }

        try {
            const data = await youtubeService.getYoutubeUrls(videoCategory, cursorIdRef.current);
            
            if (isInitial) {
                setVideos(data);
            } else {
                setVideos(prev => [...prev, ...data]);
            }

            if (data.length > 0) {
                cursorIdRef.current = data[data.length - 1].id;
                setHasMore(data.length >= 12); // Assuming backend returns 12 per page if more exist
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [videoCategory]);

    useEffect(() => {
        fetchVideos(true);
    }, [fetchVideos]);

    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    return (
        <div className="videos-page">
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <main className="container main-content py-4">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h1 className="page-title text-capitalize">{category}</h1>
                    <Link to="/" className="back-link">
                        <i className="fas fa-chevron-left"></i> Back to Home
                    </Link>
                </div>

                {loading ? (
                    <div className="videos-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="video-card-skeleton">
                                <Skeleton variant="card" height={category === 'shorts' ? '400px' : '200px'} />
                                <Skeleton variant="text" width="80%" style={{ marginTop: '10px' }} />
                            </div>
                        ))}
                    </div>
                ) : videos.length > 0 ? (
                    <>
                        <div className={`videos-grid ${category === 'shorts' ? 'shorts-layout' : 'long-layout'}`}>
                            {videos.map((video) => {
                                const videoId = getYoutubeId(video.url);
                                const thumbnail = videoId 
                                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                                    : '/placeholder-video.jpg';

                                return (
                                    <div 
                                        key={video.id} 
                                        className={`video-item branded-overlay-card ${category === 'shorts' ? 'short-item-branded' : 'long-item-branded'}`}
                                        onClick={() => handleVideoClick(video)}
                                    >
                                        <div className="video-thumbnail-wrapper">
                                            <img src={thumbnail} alt={video.title} loading="lazy" />
                                            <div className="card-overlay-branded-full">
                                                <div className="overlay-flex-container">
                                                    <img src="/favicon.png" alt="Logo" className="favicon-main" />
                                                    <div className="branding-text-content">
                                                        <h3 className="video-title">{video.title}</h3>
                                                        <span className="brand-name-text">Career Vedha</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="play-overlay">
                                                <i className="fas fa-play"></i>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {hasMore && (
                            <div className="load-more-container mt-5 text-center">
                                <button 
                                    className="load-more-btn"
                                    onClick={() => fetchVideos(false)}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state text-center py-5">
                        <i className="fas fa-video-slash fa-4x mb-3 text-muted"></i>
                        <h3>No videos found in this category.</h3>
                        <p className="text-muted">Stay tuned, we'll be adding more content soon!</p>
                    </div>
                )}
            </main>

            <VideoPlayerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                videoUrl={selectedVideo?.url || ''}
                title={selectedVideo?.title || ''}
            />

            <Footer />
        </div>
    );
};

export default VideosPage;
