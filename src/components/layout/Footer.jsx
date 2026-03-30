import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ContactForm from '../ui/ContactForm';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [showContactForm, setShowContactForm] = useState(false);
    const activeLanguage = localStorage.getItem('preferredLanguage') || 'english';

    return (
        <>
            <footer className="main-footer">
                <div className="container">
                    <div className="footer-content">
                        {/* Column 1: Academics Corner */}
                        <div className="footer-column">
                            <h4>Academics Corner</h4>
                            <ul className="footer-links">
                                <li><Link to="/academics">Academics Explorer</Link></li>
                                <li><Link to="/study-materials">Study Materials</Link></li>
                                <li><Link to="/question-papers">Previous Papers</Link></li>
                                <li><Link to="/academic-exams">Competitive Exams</Link></li>
                            </ul>
                        </div>

                        {/* Column 2: Current Affairs */}
                        <div className="footer-column">
                            <h4>Current Affairs</h4>
                            <ul className="footer-links">
                                <li><Link to="/current-affairs?region=INDIA">National (India)</Link></li>
                                <li><Link to="/current-affairs?region=TS">Telangana Updates</Link></li>
                                <li><Link to="/current-affairs?region=AP">Andhra Pradesh</Link></li>
                                <li><Link to="/current-affairs">International & General</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Job Opportunities */}
                        <div className="footer-column">
                            <h4>Job Opportunities</h4>
                            <ul className="footer-links">
                                <li><Link to="/jobs">Latest Notifications</Link></li>
                                <li><Link to="/academic-exams?category=results">Exam Results</Link></li>
                                <li><Link to="/academic-exams?category=admit-cards">Admit Cards</Link></li>
                                <li><Link to="/articles?section=guidance">Career Guidance</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Trending & News */}
                        <div className="footer-column">
                            <h4>Trending & News</h4>
                            <ul className="footer-links">
                                <li><Link to="/news">Daily Educational News</Link></li>
                                <li><Link to="/articles">Most Read Articles</Link></li>
                                <li><Link to="/videos/long">Career Vedha TV</Link></li>
                                <li><Link to="/videos/shorts">Quick Bytes (Shorts)</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="footer-bottom-flex">
                            <div className="footer-brand-mini">
                                <img 
                                    src="/Career Vedha logo.png" 
                                    alt="Career Vedha" 
                                    style={{ height: '60px', width: 'auto', marginBottom: '10px' }}
                                />
                                <p>Trusted Educational Partner</p>
                            </div>

                            <div className="footer-bottom-links">
                                <Link to="/">Home</Link>
                                <span className="separator">|</span>
                                <Link to="/about">About Us</Link>
                                <span className="separator">|</span>
                                <Link to="/terms-and-conditions">Terms & Conditions</Link>
                                <span className="separator">|</span>
                                <Link to="/privacy-policy">Privacy Policy</Link>
                                <span className="separator">|</span>
                                <Link to="/contact">Contact Us</Link>
                            </div>

                            <div className="footer-social-premium">
                                {activeLanguage === 'telugu' ? (
                                    <>
                                        <a href="https://www.facebook.com/61563861567361/" target="_blank" rel="noopener noreferrer" className="social-icon fb" title="Career Vedha Telugu Facebook">
                                            <i className="fab fa-facebook-f"></i>
                                        </a>
                                        <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" className="social-icon x-twitter"><i className="fab fa-twitter"></i></a>
                                        <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" className="social-icon insta"><i className="fab fa-instagram"></i></a>
                                        <a href="https://youtube.com/@careervedha-telugu" target="_blank" rel="noopener noreferrer" className="social-icon yt" title="Career Vedha Telugu YouTube">
                                            <i className="fab fa-youtube"></i>
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <a href="https://www.facebook.com/p/Career-Vedha-61560606159654/" target="_blank" rel="noopener noreferrer" className="social-icon fb" title="Career Vedha English Facebook">
                                            <i className="fab fa-facebook-f"></i>
                                        </a>
                                        <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" className="social-icon x-twitter"><i className="fab fa-twitter"></i></a>
                                        <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" className="social-icon insta"><i className="fab fa-instagram"></i></a>
                                        <a href="https://youtube.com/@careervedha" target="_blank" rel="noopener noreferrer" className="social-icon yt" title="Career Vedha English YouTube">
                                            <i className="fab fa-youtube"></i>
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="copyright-bar mt-4">
                            <p>
                                &copy; {currentYear} Career Vedha. All rights reserved. | Empowering Students Nationwide
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        </>
    );
};

export default Footer;
