import React from 'react';

const TopBar = () => {
    return (
        <div className="top-bar">
            <div className="container">
                <div className="top-bar-content">
                    <div className="sister-sites">
                        <a href="#" className="site-link">Bhavita</a>
                        <a href="#" className="site-link">EPaper</a>
                        <a href="#" className="site-link">Career Vedha News</a>
                        <a href="#" className="site-link">Career Vedha Post</a>
                    </div>
                    <div className="social-links">
                        <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                        <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                        <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
                        <a href="#" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
