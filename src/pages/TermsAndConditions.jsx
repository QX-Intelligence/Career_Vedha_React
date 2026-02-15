import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import '../styles/TermsAndConditions.css';

const TermsAndConditions = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);
    
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const lastUpdated = "February 14, 2026";

    return (
        <div className="page-wrapper">
            <Header />
            <PrimaryNav />

            <main className="terms-page">
                <div className="container">
                    <div className="terms-header">
                        <h1>Terms and Conditions</h1>
                        <p className="last-updated">Last Updated: {lastUpdated}</p>
                    </div>

                    <div className="terms-content">
                        <section>
                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using the Career Vedha platform (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Service.
                            </p>
                        </section>

                        <section>
                            <h2>2. Description of Service</h2>
                            <p>
                                Career Vedha is an educational platform providing news, study materials, job notifications, exam updates, and other career-related information. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
                            </p>
                        </section>

                        <section>
                            <h2>3. User Responsibilities</h2>
                            <p>
                                As a user of Career Vedha, you agree to:
                            </p>
                            <ul>
                                <li>Provide accurate and complete information when required.</li>
                                <li>Maintain the confidentiality of your account credentials.</li>
                                <li>Use the platform for lawful and educational purposes only.</li>
                                <li>Not engage in any activity that interferes with or disrupts the Service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>4. Intellectual Property</h2>
                            <p>
                                All content on Career Vedha, including articles, logos, designs, text, graphics, and software, is the property of Career Vedha and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                            </p>
                            <p>
                                Study materials provided on the site are for personal, non-commercial use only.
                            </p>
                        </section>

                        <section>
                            <h2>5. Third-Party Links</h2>
                            <p>
                                Our Service may contain links to third-party websites (e.g., official recruitment portals, news sources). Career Vedha is not responsible for the content, privacy policies, or practices of any third-party sites.
                            </p>
                        </section>

                        <section>
                            <h2>6. Disclaimer of Warranties</h2>
                            <p>
                                Career Vedha provides information on an "as is" and "as available" basis. While we strive for accuracy, we do not warrant that the information is complete, accurate, or up-to-date. Users are encouraged to verify information from official sources.
                            </p>
                        </section>

                        <section>
                            <h2>7. Limitation of Liability</h2>
                            <p>
                                Career Vedha shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the Service.
                            </p>
                        </section>

                        <section>
                            <h2>8. Privacy Policy</h2>
                            <p>
                                Your use of the Service is also governed by our Privacy Policy. Please review it to understand our practices regarding your data.
                            </p>
                        </section>

                        <section>
                            <h2>9. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms and Conditions, please contact us at:
                            </p>
                            <p className="contact-details">
                                <strong>Email:</strong> info@careervedha.com<br />
                                <strong>Address:</strong> Hyderabad, Telangana, India
                            </p>
                            <button 
                                className="premium-contact-trigger"
                                style={{ marginTop: '24px', maxWidth: '280px' }}
                                onClick={() => setShowContactForm(true)}
                            >
                                <i className="fas fa-paper-plane"></i>
                                <span>CONTACT US</span>
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        </div>
    );
};

export default TermsAndConditions;
