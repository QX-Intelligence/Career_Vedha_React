import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import SEO from '../components/seo/SEO';
import '../styles/TermsAndConditions.css';

const ContactUsPage = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="page-wrapper">
            <SEO
                title="Contact Us"
                description="Get in touch with Career Vedha. Reach us via email at Contact@careervedha.com for queries, feedback, or support about our educational platform."
                url="https://careervedha.com/contact"
            />
            <Header />
            <PrimaryNav />

            <main className="terms-page">
                <div className="container">
                    <div className="terms-header">
                        <h1>Contact Us</h1>
                        <p className="subtitle">We'd love to hear from you</p>
                    </div>

                    <div className="terms-content">
                        <section>
                            <h2>Get in Touch</h2>
                            <p>
                                Have a question, suggestion, or need support? We are here to help. Reach out to us through any of the channels below and we'll get back to you as soon as possible.
                            </p>
                        </section>

                        <section>
                            <h2>Contact Information</h2>
                            <ul>
                                <li>
                                    <strong>Email:</strong>{' '}
                                    <a href="mailto:Contact@careervedha.com" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        Contact@careervedha.com
                                    </a>
                                </li>
                                <li><strong>Organization:</strong> Career Vedha</li>
                                <li><strong>Location:</strong> Telangana, India</li>
                                <li><strong>Service Area:</strong> Pan India</li>
                                <li>
                                    <strong>Website:</strong>{' '}
                                    <a href="https://careervedha.com" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        careervedha.com
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2>Response Time</h2>
                            <p>
                                We typically respond to all queries within <strong>1–2 business days</strong>. For urgent matters, please mention "URGENT" in your email subject line.
                            </p>
                        </section>

                        <section>
                            <h2>What Can We Help You With?</h2>
                            <ul>
                                <li>Questions about our educational content or study materials</li>
                                <li>Job notification or career guidance queries</li>
                                <li>Technical issues with the platform</li>
                                <li>Content corrections or suggestions</li>
                                <li>Partnership and collaboration inquiries</li>
                                <li>Advertising and media inquiries</li>
                                <li>Privacy or data-related requests</li>
                            </ul>
                        </section>

                        <section>
                            <h2>Send Us a Message</h2>
                            <p>Click the button below to open our contact form and send us a message directly:</p>
                            <button
                                className="premium-contact-trigger"
                                style={{ marginTop: '24px', maxWidth: '280px' }}
                                onClick={() => setShowContactForm(true)}
                            >
                                <i className="fas fa-envelope"></i>
                                <span>OPEN CONTACT FORM</span>
                            </button>
                        </section>

                        <section>
                            <h2>Follow Us</h2>
                            <p>Stay connected with Career Vedha on social media for the latest updates:</p>
                            <ul>
                                <li>
                                    <strong>Facebook:</strong>{' '}
                                    <a href="https://www.facebook.com/p/Career-Vedha-61560606159654/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        Career Vedha on Facebook
                                    </a>
                                </li>
                                <li>
                                    <strong>Twitter / X:</strong>{' '}
                                    <a href="https://x.com/careervedha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        @careervedha
                                    </a>
                                </li>
                                <li>
                                    <strong>Instagram:</strong>{' '}
                                    <a href="https://www.instagram.com/careervedha/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        @careervedha
                                    </a>
                                </li>
                                <li>
                                    <strong>YouTube:</strong>{' '}
                                    <a href="https://youtube.com/@careervedha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #62269E)' }}>
                                        Career Vedha YouTube
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        </div>
    );
};

export default ContactUsPage;
