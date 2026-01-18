import React from 'react';

const AppDownload = () => {
    const handleDownload = (platform) => {
        alert(`App download will be available soon for ${platform}! Thank you for your interest.`);
    };

    return (
        <div className="sidebar-widget app-download">
            <h3 className="widget-title">Download Our App</h3>
            <p>Get instant notifications</p>
            <div className="app-buttons">
                <a
                    href="#"
                    className="app-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        handleDownload('Android');
                    }}
                >
                    <i className="fab fa-google-play"></i>
                    <span>Google Play</span>
                </a>
                <a
                    href="#"
                    className="app-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        handleDownload('iOS');
                    }}
                >
                    <i className="fab fa-apple"></i>
                    <span>App Store</span>
                </a>
            </div>
        </div>
    );
};

export default AppDownload;
