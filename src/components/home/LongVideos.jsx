import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { youtubeService } from '../../services';
import Skeleton from '../ui/Skeleton';

const LongVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleVideoClick = (url) => {
        const videoId = getYoutubeId(url);
        if (videoId) {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        } else {
            window.open(url, '_blank');
        }
    };

    if (loading) {
        return (
            <section className="long-videos-section py-5">
                <div className="container">
                    <div className="section-header d-flex justify-content-between align-items-center mb-4">
                        <Skeleton variant="title" width="200px" />
                    </div>
                    <div className="row">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="col-lg-3 col-md-6 mb-4">
                                <Skeleton variant="card" height="180px" />
                            </div>
                        ))}
                    </div>
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
                        <div key={video.id} className="long-video-card-branded" onClick={() => handleVideoClick(video.url)}>
                            <div className="card-branded-header">
                                <div className="brand-logo-mini">
                                    <i className="fas fa-graduation-cap"></i>
                                    <span>Career Vedha</span>
                                </div>
                                <h4 className="card-branded-title line-clamp-1">{video.title}</h4>
                            </div>
                            <div className="card-branded-body">
                                <div className="video-thumb-container">
                                    <img 
                                        src={thumbnail} 
                                        alt={video.title} 
                                        className="card-img-branded"
                                    />
                                    <div className="play-icon-overlay-branded">
                                        <i className="fas fa-play-circle text-white fa-3x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #eee;
                }
                .long-video-card-branded:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
                }
                .card-branded-header {
                    padding: 12px;
                    background: #f8fafc;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    height: 80px;
                }
                .brand-logo-mini {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--primary-yellow, #ffca28);
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .card-branded-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #334155;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .card-branded-body {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
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
                }
                .play-icon-overlay-branded {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .long-video-card-branded:hover .play-icon-overlay-branded {
                    opacity: 1;
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
                    font-size: 1.25rem;
                }
                @media (max-width: 640px) {
                    .long-video-card-branded {
                        width: 100%;
                        height: 250px;
                    }
                }
            `}} />
        </section>
    );
};

export default LongVideos;
