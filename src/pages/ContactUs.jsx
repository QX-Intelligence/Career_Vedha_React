import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import '../styles/TermsAndConditions.css';

const ContactUsPage = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="page-wrapper">
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
                            <p>
                                If you have any questions or concerns, feel free to reach out.
                            </p>
                            <p>
                                <strong>Email:</strong> <a href="mailto:careervedha@gmail.com" style={{ color: 'var(--accent-color, #62269E)' }}>careervedha@gmail.com</a>
                            </p>
                            <button 
                                className="premium-contact-trigger"
                                style={{ marginTop: '24px', maxWidth: '280px' }}
                                onClick={() => setShowContactForm(true)}
                            >
                                <i className="fas fa-envelope"></i>
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

export default ContactUsPage;
