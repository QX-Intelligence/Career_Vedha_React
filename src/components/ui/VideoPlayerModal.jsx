import React from 'react';
import './VideoPlayerModal.css';

const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title }) => {
    if (!isOpen) return null;

    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(videoUrl);
    const isShort = videoUrl.includes('shorts');
    
    // Construct embed URL with autoplay
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;

    return (
        <div className="video-player-modal-overlay" onClick={onClose}>
            <div className="video-player-modal-content" onClick={e => e.stopPropagation()}>
                <button className="video-modal-close" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>
                <div className="video-player-header">
                    <h3 className="modal-video-title">{title}</h3>
                </div>
                <div className={`video-iframe-container ${isShort ? 'short-aspect' : 'long-aspect'}`}>
                    {videoId ? (
                        <iframe
                            src={embedUrl}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="video-error">Invalid Video URL</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerModal;
