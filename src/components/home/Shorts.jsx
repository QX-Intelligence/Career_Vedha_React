import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { youtubeService } from '../../services';
import Skeleton from '../ui/Skeleton';

const Shorts = ({ activeLanguage }) => {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShorts = async () => {
            setLoading(true);
            try {
                const data = await youtubeService.getYoutubeUrls(youtubeService.CATEGORIES.SHORTS);
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

    const handleShortClick = (url) => {
        const videoId = getYoutubeId(url);
        if (videoId) {
            window.open(`https://www.youtube.com/shorts/${videoId}`, '_blank');
        } else {
            window.open(url, '_blank');
        }
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
        <section className="shorts-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Shorts</h2>
                    <Link to="/videos/shorts" className="see-all-btn">
                        See All <i className="fas fa-arrow-right"></i>
                    </Link>
                </div>
                <div className="shorts-grid">
                    {shorts.map((short) => {
                        const videoId = getYoutubeId(short.url);
                        const thumbnail = videoId 
                            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                            : '/placeholder-short.jpg';
                        
                        return (
                            <div
                                key={short.id}
                                className="short-item"
                                onClick={() => handleShortClick(short.url)}
                            >
                                <img src={thumbnail} alt={short.title} />
                                <div className="short-overlay">
                                    <i className="fas fa-play"></i>
                                    <span className="short-title-text">{short.title}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Shorts;
