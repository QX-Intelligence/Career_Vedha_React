import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="main-footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-column">
                        <div className="footer-logo">
                            <h3>Career Vedha</h3>
                            <p>Your trusted educational partner</p>
                        </div>
                        <div className="footer-social">
                            <a href="#"><i className="fab fa-facebook-f"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="#"><i className="fab fa-instagram"></i></a>
                            <a href="#"><i className="fab fa-youtube"></i></a>
                            <a href="#"><i className="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Advertise</a></li>
                            <li><a href="#">Careers</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Study Materials</a></li>
                            <li><a href="#">Previous Papers</a></li>
                            <li><a href="#">Mock Tests</a></li>
                            <li><a href="#">Video Lectures</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Legal</h4>
                        <ul>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Use</a></li>
                            <li><a href="#">Disclaimer</a></li>
                            <li><a href="#">Sitemap</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Contact Info</h4>
                        <ul className="contact-info">
                            <li><i className="fas fa-envelope"></i> info@Career Vedha.com</li>
                            <li><i className="fas fa-phone"></i> +91 1234567890</li>
                            <li><i className="fas fa-map-marker-alt"></i> Hyderabad, India</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} Career Vedha. All rights reserved. | Designed with <i className="fas fa-heart"></i> for students</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
