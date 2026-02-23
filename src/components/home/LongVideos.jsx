import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { youtubeService } from '../../services';
import Skeleton from '../ui/Skeleton';
import VideoPlayerModal from '../ui/VideoPlayerModal';

const LongVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                const data = await youtubeService.getYoutubeUrls(youtubeService.CATEGORIES.LONG);
                setVideos(data.slice(0, 4)); // Show 4 videos in the section
            } catch (error) {
                console.error('Error loading long videos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <section className="long-videos-section py-4">
                <div className="section-header-flex d-flex justify-content-between align-items-center mb-4">
                    <Skeleton variant="title" width="200px" />
                </div>
                <div className="row">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="col-lg-3 col-md-6 mb-4">
                            <Skeleton variant="card" height="300px" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (videos.length === 0) return null;

    return (
        <section className="long-videos-section py-4">
            <div className="section-header-flex d-flex justify-content-between align-items-center mb-4">
                <h3 className="video-subsection-title m-0">Latest Videos</h3>
                <Link to="/videos/long" className="btn-modern-see-all">
                    See All <i className="fas fa-arrow-right ml-1"></i>
                </Link>
            </div>
            <div className="long-videos-flex-grid">
                {videos.map((video) => {
                    const videoId = getYoutubeId(video.url);
                    const thumbnail = videoId 
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : '/placeholder-video.jpg';
                    
                    return (
                        <div key={video.id} className="long-video-card-branded" onClick={() => handleVideoClick(video)}>
                            <div className="video-thumb-container">
                                <img 
                                    src={thumbnail} 
                                    alt={video.title} 
                                    className="card-img-branded"
                                />
                                <div className="card-overlay-content-branded">
                                    <div className="overlay-flex-container">
                                        <img src="/favicon.png" alt="Logo" className="favicon-main" />
                                        <div className="branding-text-content">
                                            <h4 className="card-branded-title line-clamp-2">{video.title}</h4>
                                            <span className="brand-name-text">Career Vedha</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="play-icon-overlay-branded">
                                    <i className="fas fa-play-circle text-white fa-3x"></i>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <VideoPlayerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                videoUrl={selectedVideo?.url || ''}
                title={selectedVideo?.title || ''}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .long-videos-flex-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: center;
                }
                .long-video-card-branded {
                    width: 300px;
                    height: 300px;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                }
                .long-video-card-branded:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.25);
                }
                .video-thumb-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                .card-img-branded {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.8;
                    transition: opacity 0.3s ease;
                }
                .long-video-card-branded:hover .card-img-branded {
                    opacity: 0.6;
                }
                .card-overlay-content-branded {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    padding: 20px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
                    z-index: 2;
                }
                .overlay-flex-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }
                .favicon-main {
                    width: 45px;
                    height: 45px;
                    object-fit: contain;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .branding-text-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    flex: 1;
                }
                .brand-name-text {
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.9;
                }
                .card-branded-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                    line-height: 1.35;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .play-icon-overlay-branded {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.3;
                    transition: all 0.3s ease;
                    z-index: 1;
                }
                .long-video-card-branded:hover .play-icon-overlay-branded {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }
                .btn-modern-see-all {
                    padding: 6px 16px;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .btn-modern-see-all:hover {
                    background: #f1f5f9;
                    color: #334155;
                    border-color: #cbd5e1;
                }
                .video-subsection-title {
                    color: #1e293b;
                    font-weight: 700;
                    font-size: 1.5rem;
                }
                @media (max-width: 640px) {
                    .long-video-card-branded {
                        width: 100%;
                        height: 250px;
                    }
                    .favicon-main {
                        width: 35px;
                        height: 35px;
                    }
                    .card-branded-title {
                        font-size: 1rem;
                    }
                }
            `}} />
        </section>
    );
};

export default LongVideos;
