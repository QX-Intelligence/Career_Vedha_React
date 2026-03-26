import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import '../styles/TermsAndConditions.css';

const PrivacyPolicy = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const lastUpdated = "March 26, 2026";

    return (
        <div className="page-wrapper">
            <Header />
            <PrimaryNav />

            <main className="terms-page">
                <div className="container">
                    <div className="terms-header">
                        <h1>Privacy Policy</h1>
                        <p className="last-updated">Last Updated: {lastUpdated}</p>
                    </div>

                    <div className="terms-content">
                        <section>
                            <h2>1. Information We Collect</h2>
                            <p>
                                We may collect personal information such as name and email when you register or contact us.
                            </p>
                        </section>

                        <section>
                            <h2>2. Cookies</h2>
                            <p>
                                We use cookies to improve user experience and analyze traffic.
                            </p>
                        </section>

                        <section>
                            <h2>3. Google AdSense</h2>
                            <p>
                                We use Google AdSense to display ads. Google may use cookies (such as the DoubleClick cookie) to serve ads based on your visits to this and other websites.
                            </p>
                            <p>
                                Users may opt out of personalized advertising by visiting: <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">https://adssettings.google.com/</a>
                            </p>
                        </section>

                        <section>
                            <h2>4. Third-Party Privacy Policies</h2>
                            <p>
                                Career Vedha’s Privacy Policy does not apply to other advertisers or websites.
                            </p>
                        </section>

                        <section>
                            <h2>5. Consent</h2>
                            <p>
                                By using our website, you consent to our Privacy Policy.
                            </p>
                        </section>

                        <section>
                            <h2>6. Contact Us</h2>
                            <p>
                                If you have any questions, contact us at: <strong>careervedha@gmail.com</strong>
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

export default PrivacyPolicy;
