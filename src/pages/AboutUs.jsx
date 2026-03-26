import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import '../styles/TermsAndConditions.css';

const AboutUs = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);
    
    // Scroll to top on mount
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
                        <h1>About Career Vedha</h1>
                        <p className="subtitle">Your Trusted Educational & Career Companion</p>
                    </div>

                    <div className="terms-content">
                        <section>
                            <h2>About Career Vedha</h2>
                            <p>
                                Career Vedha is an educational platform focused on providing job updates, study materials, exam notifications, and career guidance for students and job seekers.
                            </p>
                            <p>
                                Our goal is to deliver accurate and timely information to help users make better career decisions.
                            </p>
                        </section>

                        <section>
                            <p>
                                For any queries, contact: <strong>careervedha@gmail.com</strong>
                            </p>
                            <button 
                                className="premium-contact-trigger"
                                style={{ marginTop: '24px', maxWidth: '280px' }}
                                onClick={() => setShowContactForm(true)}
                            >
                                <i className="fas fa-paper-plane"></i>
                                <span>GET IN TOUCH</span>
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

export default AboutUs;
