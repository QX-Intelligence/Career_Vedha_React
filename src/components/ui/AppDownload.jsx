import React from 'react';

const AppDownload = () => {
    const handleDownload = (platform) => {
        alert(`App download will be available soon for ${platform}! Thank you for your interest.`);
    };

    return (
        <div className="sidebar-widget app-download">
            <h3 className="widget-title">Download Our App</h3>
            <p className="app-subtitle">Get instant notifications & offline reading</p>
            <div className="app-buttons">
                <a
                    href="#"
                    className="app-btn google-play"
                    onClick={(e) => {
                        e.preventDefault();
                        handleDownload('Android');
                    }}
                >
                    <i className="fab fa-google-play"></i>
                    <div className="btn-text">
                        <span>GET IT ON</span>
                        <strong>Google Play</strong>
                    </div>
                </a>
                <a
                    href="#"
                    className="app-btn app-store"
                    onClick={(e) => {
                        e.preventDefault();
                        handleDownload('iOS');
                    }}
                >
                    <i className="fab fa-apple"></i>
                    <div className="btn-text">
                        <span>Download on the</span>
                        <strong>App Store</strong>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default AppDownload;
