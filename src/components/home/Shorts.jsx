import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { youtubeService } from '../../services';
import Skeleton from '../ui/Skeleton';
import VideoPlayerModal from '../ui/VideoPlayerModal';

const Shorts = ({ activeLanguage }) => {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchShorts = async () => {
            setLoading(true);
            try {
                const data = await youtubeService.getYoutubeUrls(youtubeService.CATEGORIES.SHORT);
                // Return only 4-6 for the home page section
                setShorts(data.slice(0, 6));
            } catch (error) {
                console.error('Error loading shorts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShorts();
    }, []);

    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleShortClick = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <section className="shorts-section">
                <div className="container">
                    <div className="section-header">
                        <Skeleton variant="title" width="150px" />
                    </div>
                    <div className="shorts-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="short-item">
                                <Skeleton variant="card" height="300px" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (shorts.length === 0) return null;

    return (
        <section className="shorts-section-branded py-4">
            <div className="section-header-flex d-flex justify-content-between align-items-center mb-4">
                <h3 className="video-subsection-title m-0">Shorts</h3>
                <Link to="/videos/shorts" className="btn-modern-see-all">
                    See All <i className="fas fa-arrow-right ml-1"></i>
                </Link>
            </div>
            <div className="shorts-flex-grid">
                {shorts.map((short) => {
                    const videoId = getYoutubeId(short.url);
                    const thumbnail = videoId 
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : '/placeholder-short.jpg';
                    
                    return (
                        <div key={short.id} className="short-card-branded" onClick={() => handleShortClick(short)}>
                            <div className="video-thumb-container">
                                <img 
                                    src={thumbnail} 
                                    alt={short.title} 
                                    className="card-img-branded"
                                />
                                <div className="card-overlay-content-branded">
                                    <div className="overlay-flex-container">
                                        <img src="/favicon.png" alt="Logo" className="favicon-main" />
                                        <div className="branding-text-content">
                                            <h4 className="card-branded-title line-clamp-2">{short.title}</h4>
                                            <span className="brand-name-text">Career Vedha</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="play-icon-overlay-branded">
                                    <i className="fas fa-play text-white fa-2x"></i>
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
                .shorts-flex-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                }
                .short-card-branded {
                    width: 200px;
                    height: 250px;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                }
                .short-card-branded:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
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
                    opacity: 0.85;
                    transition: opacity 0.3s ease;
                }
                .short-card-branded:hover .card-img-branded {
                    opacity: 0.7;
                }
                .card-overlay-content-branded {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
                    z-index: 2;
                }
                .overlay-flex-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                .favicon-main {
                    width: 32px;
                    height: 32px;
                    object-fit: contain;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .branding-text-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    flex: 1;
                }
                .brand-name-text {
                    color: #fff;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.9;
                }
                .card-branded-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                    line-height: 1.3;
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
                .short-card-branded:hover .play-icon-overlay-branded {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }
                @media (max-width: 480px) {
                    .short-card-branded {
                        width: calc(50% - 10px);
                        height: 220px;
                    }
                    .favicon-main {
                        width: 24px;
                        height: 24px;
                    }
                }
            `}} />
        </section>
    );
};

export default Shorts;
