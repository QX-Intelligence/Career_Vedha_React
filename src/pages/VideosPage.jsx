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

/* ── Small reusable section that fetches one category ── */
const VideoSection = ({ apiCategory, label, layoutClass, onVideoClick }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const cursorIdRef = useRef(null);

    const fetchVideos = useCallback(async (isInitial = false) => {
        if (isInitial) { setLoading(true); cursorIdRef.current = null; }
        else { setLoadingMore(true); }

        try {
            const data = await youtubeService.getYoutubeUrls(apiCategory, cursorIdRef.current);
            if (isInitial) setVideos(data);
            else setVideos(prev => [...prev, ...data]);

            if (data.length > 0) {
                cursorIdRef.current = data[data.length - 1].id;
                setHasMore(data.length >= 12);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error(`Error fetching ${label}:`, error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [apiCategory, label]);

    useEffect(() => { fetchVideos(true); }, [fetchVideos]);

    const getYoutubeId = (url) => {
        const m = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11})/);
        return m ? m[1] : null;
    };

    if (loading) {
        return (
            <section className="video-section">
                <div className="videos-section-header"><h2>{label}</h2></div>
                <div className={`videos-grid ${layoutClass}`}>
                    {[1,2,3,4].map(i => (
                        <div key={i} className="video-card-skeleton">
                            <Skeleton variant="card" height={layoutClass === 'shorts-layout' ? '350px' : '200px'} />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (videos.length === 0) return null;

    return (
        <section className="video-section">
            <div className="videos-section-header">
                <h2>
                    {label}
                    <span className="videos-count-badge">{videos.length}</span>
                </h2>
            </div>

            <div className={`videos-grid ${layoutClass}`}>
                {videos.map((video) => {
                    const videoId = getYoutubeId(video.url);
                    const thumbnail = videoId
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : '/placeholder-video.jpg';
                    return (
                        <div
                            key={video.id}
                            className={`video-item branded-overlay-card ${layoutClass === 'shorts-layout' ? 'short-item-branded' : 'long-item-branded'}`}
                            onClick={() => onVideoClick(video)}
                        >
                            <div className="video-thumbnail-wrapper">
                                <img src={thumbnail} alt={video.title} loading="lazy" className="thumbnail-main" />
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
                <div className="load-more-container">
                    <button className="load-more-btn" onClick={() => fetchVideos(false)} disabled={loadingMore}>
                        {loadingMore
                            ? <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                            : <>Load More <i className="fas fa-chevron-down"></i></>}
                    </button>
                </div>
            )}
        </section>
    );
};

/* ── Main Page ── */
const VideosPage = () => {
    const { category } = useParams(); // undefined when on /videos
    const [activeLanguage, setActiveLanguage] = useState(() => localStorage.getItem('preferredLanguage') || 'english');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [category]);

    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    // Determine which sections to show
    const showLong = !category || category === 'long';
    const showShorts = !category || category === 'shorts';
    const pageTitle = !category ? 'Videos' : (category === 'shorts' ? 'Shorts' : 'Videos');

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

            <main className="videos-main-content">
                <div className="container">
                    <nav className="videos-breadcrumb">
                        <Link to="/">Home</Link>
                        <i className="fas fa-chevron-right"></i>
                        <span>{pageTitle}</span>
                    </nav>

                    {showLong && (
                        <VideoSection
                            apiCategory="LONG"
                            label="Long Videos"
                            layoutClass="long-layout"
                            onVideoClick={handleVideoClick}
                        />
                    )}

                    {showShorts && (
                        <VideoSection
                            apiCategory="SHORT"
                            label="Shorts"
                            layoutClass="shorts-layout"
                            onVideoClick={handleVideoClick}
                        />
                    )}
                </div>
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
