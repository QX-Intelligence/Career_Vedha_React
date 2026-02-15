import React from 'react';
import { Link } from 'react-router-dom';

const TopBar = () => {
    return (
        <div className="top-bar">
            <div className="container">
                <div className="top-bar-content">
                    <div className="sister-sites">
                        <a href="https://bhavita.com" target="_blank" rel="noopener noreferrer" className="site-link">Bhavita</a>
                        <a href="https://epaper.careervedha.com" target="_blank" rel="noopener noreferrer" className="site-link">EPaper</a>
                        <Link to="/news" className="site-link">Career Vedha News</Link>
                        <a href="https://post.careervedha.com" target="_blank" rel="noopener noreferrer" className="site-link">Career Vedha Post</a>
                    </div>
                    <div className="top-bar-social">
                        <a href="https://www.facebook.com/p/Career-Vedha-61560606159654/" target="_blank" rel="noopener noreferrer" className="social-icon-sm fb"><i className="fab fa-facebook-f"></i></a>
                        <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" className="social-icon-sm x-twitter"><i className="fab fa-twitter"></i></a>
                        <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" className="social-icon-sm insta"><i className="fab fa-instagram"></i></a>
                        <a href="https://youtube.com/@careervedha" target="_blank" rel="noopener noreferrer" className="social-icon-sm yt"><i className="fab fa-youtube"></i></a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="social-icon-sm linkedin"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
