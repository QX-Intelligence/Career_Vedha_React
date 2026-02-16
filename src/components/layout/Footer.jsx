import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ContactForm from '../ui/ContactForm';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [showContactForm, setShowContactForm] = useState(false);

    return (
        <>
            <footer className="main-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-column brand-column">
                            <div className="footer-logo">
                                <h3>Career Vedha</h3>
                                <p>Stay ahead in your career with trusted educational insights, job updates, and comprehensive study materials.</p>
                            </div>
                            <div className="footer-social-premium">
                                <a href="https://www.facebook.com/p/Career-Vedha-61560606159654/" target="_blank" rel="noopener noreferrer" className="social-icon fb"><i className="fab fa-facebook-f"></i></a>
                                <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" className="social-icon x-twitter"><i className="fab fa-twitter"></i></a>
                                <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" className="social-icon insta"><i className="fab fa-instagram"></i></a>
                                <a href="https://youtube.com/@careervedha" target="_blank" rel="noopener noreferrer" className="yt-btn en">
                                    <i className="fab fa-youtube"></i> <span>EN</span>
                                </a>
                                <a href="https://youtube.com/@careervedha-telugu" target="_blank" rel="noopener noreferrer" className="yt-btn te">
                                    <i className="fab fa-youtube"></i> <span>TE</span>
                                </a>
                            </div>
                        </div>

                        <div className="footer-column links-column">
                            <h4>Quick Links</h4>
                            <ul className="footer-links">
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/advertise">Advertise</Link></li>
                                <li><Link to="/careers">Careers</Link></li>
                                <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column links-column">
                            <h4>Resources</h4>
                            <ul className="footer-links">
                                <li><Link to="/study-materials">Study Materials</Link></li>
                                <li><Link to="/question-papers">Previous Papers</Link></li>
                                <li><Link to="/mock-tests">Mock Tests</Link></li>
                                <li><Link to="/current-affairs">Current Affairs</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column contact-column">
                            <h4>Get in Touch</h4>
                            <button 
                                className="premium-contact-trigger"
                                onClick={() => setShowContactForm(true)}
                            >
                                <i className="fas fa-paper-plane"></i>
                                <span>CONTACT US</span>
                            </button>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="footer-sister-row">
                            <div className="sister-sites">
                                <a href="https://bhavita.com" target="_blank" rel="noopener noreferrer" className="site-link">Bhavita</a>
                                <a href="https://epaper.careervedha.com" target="_blank" rel="noopener noreferrer" className="site-link">EPaper</a>
                                <Link to="/news" className="site-link">Career Vedha News</Link>
                                <a href="https://post.careervedha.com" target="_blank" rel="noopener noreferrer" className="site-link">Career Vedha Post</a>
                            </div>
                            <div className="top-bar-social desktop-only">
                                <a href="https://www.facebook.com/p/Career-Vedha-61560606159654/" target="_blank" rel="noopener noreferrer" className="social-icon-sm fb"><i className="fab fa-facebook-f"></i></a>
                                <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" className="social-icon-sm x-twitter"><i className="fab fa-twitter"></i></a>
                                <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" className="social-icon-sm insta"><i className="fab fa-instagram"></i></a>
                                <a href="https://youtube.com/@careervedha" target="_blank" rel="noopener noreferrer" className="social-icon-sm yt"><i className="fab fa-youtube"></i></a>
                            </div>
                        </div>
                        <p>&copy; {currentYear} Career Vedha. All rights reserved. | Designed with <i className="fas fa-heart"></i> for students</p>
                    </div>
                </div>
            </footer>

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        </>
    );
};

export default Footer;
