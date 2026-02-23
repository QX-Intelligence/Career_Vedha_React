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
                const data = await youtubeService.getYoutubeUrls(youtubeService.CATEGORIES.LONG_VIDEO);
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
        <section className="long-videos-section py-5 bg-light">
            <div className="container">
                <div className="section-header d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title m-0">Latest Videos</h2>
                    <Link to="/videos/long_video" className="btn btn-outline-primary btn-sm rounded-pill">
                        See All <i className="fas fa-arrow-right ml-1"></i>
                    </Link>
                </div>
                <div className="row">
                    {videos.map((video) => {
                        const videoId = getYoutubeId(video.url);
                        const thumbnail = videoId 
                            ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                            : '/placeholder-video.jpg';
                        
                        return (
                            <div key={video.id} className="col-lg-3 col-md-6 mb-4">
                                <div 
                                    className="video-card h-100 shadow-sm border-0 rounded-lg overflow-hidden cursor-pointer"
                                    onClick={() => handleVideoClick(video.url)}
                                    style={{ cursor: 'pointer', transition: 'transform 0.3s' }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div className="position-relative">
                                        <img 
                                            src={thumbnail} 
                                            alt={video.title} 
                                            className="card-img-top"
                                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                        />
                                        <div className="play-icon-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center" style={{ top: 0, left: 0, background: 'rgba(0,0,0,0.2)' }}>
                                            <i className="fas fa-play-circle text-white fa-3x"></i>
                                        </div>
                                    </div>
                                    <div className="card-body p-3">
                                        <h5 className="card-title h6 m-0 line-clamp-2" style={{ fontWeight: '600' }}>{video.title}</h5>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default LongVideos;
