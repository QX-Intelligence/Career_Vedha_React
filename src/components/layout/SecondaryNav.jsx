import React from 'react';

const SecondaryNav = () => {
    const quickLinks = [
        'EAMCET', 'NEET', 'WEB STORIES', 'LATEST NEWS', 'CURRENT AFFAIRS',
        'AP 10TH CLASS', 'TS 10TH CLASS', 'AP INTER', 'TS INTER',
        'AP DSC', 'APPSC', 'JOBS', 'PREVIOUS PAPERS'
    ];

    return (
        <nav className="secondary-nav">
            <div className="nav-container">
                <div className="quick-links-wrapper">
                    {quickLinks.map((link, index) => (
                        <a href="#" key={index} className="quick-link-badge">
                            {link}
                        </a>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default SecondaryNav;
