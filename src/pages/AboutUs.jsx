import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import SEO from '../components/seo/SEO';
import '../styles/TermsAndConditions.css';

const AboutUs = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);
    
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="page-wrapper">
            <SEO
                title="About Us"
                description="Career Vedha is an advanced ed-tech platform connecting education, competitive exams, career guidance, and job opportunities for learners across India."
                url="https://careervedha.com/about"
            />
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
                            <p className="highlight-quote" style={{ fontStyle: 'italic', fontWeight: '600', color: 'var(--primary-purple, #6a1b9a)', fontSize: '1.2rem', marginTop: '10px' }}>
                                "Sa Vidya Ya Vimuktaye" (True education is that which liberates.)
                            </p>
                            <p>
                                In today's world, education is not just about studying — it is about understanding, preparing, and building a meaningful future. Yet, for millions of learners across India, this journey remains fragmented.
                            </p>
                            <p>
                                Students study subjects, prepare for exams, search for careers, look for jobs, and explore opportunities — but often across different platforms, without a clear connection between them.
                            </p>
                            <p>
                                This lack of integration leads to confusion, missed opportunities, and decisions made without complete awareness. Career Vedha was created to bring everything together.
                            </p>
                        </section>

                        <section>
                            <h2>Who We Are</h2>
                            <p>
                                Career Vedha is an advanced ed-tech platform designed as a complete ecosystem for education, exams, careers, skills, and opportunities.
                            </p>
                            <p>
                                We believe that learning should not happen in isolation. It should be connected to real outcomes — careers, jobs, startups, and growth.
                            </p>
                            <p>
                                Built for learners across India, Career Vedha provides structured, practical, and accessible content, available in English and regional languages like Telugu, ensuring wider reach and inclusivity.
                            </p>
                        </section>

                        <section>
                            <h2>What We Do</h2>
                            <p>
                                Career Vedha connects every stage of a learner's journey into one unified platform:
                            </p>
                            <ul>
                                <li>Academic learning resources, study materials, and model papers</li>
                                <li>Entrance and competitive exam preparation support</li>
                                <li>Career pathways and progression insights</li>
                                <li>Job opportunities, recruitment updates, and career openings</li>
                                <li>Campus directory of schools, colleges, universities, and institutions</li>
                                <li>Campus news, updates, and academic developments</li>
                                <li>Success stories for real-world inspiration</li>
                                <li>Skill development and entrepreneurial awareness</li>
                                <li>Access to books, e-books, courses, services, and events</li>
                            </ul>
                        </section>

                        <section>
                            <h2>The Problem We Are Solving</h2>
                            <p>Today, learners face a disconnected system:</p>
                            <ul>
                                <li>Education without clear outcomes</li>
                                <li>Preparation without direction</li>
                                <li>Opportunities without awareness</li>
                                <li>Skills without application</li>
                            </ul>
                            <p>
                                Career Vedha solves this by creating a connected ecosystem, where learning, preparation, and opportunities are aligned and accessible in one place.
                            </p>
                        </section>

                        <section>
                            <h2>Why Society Needs Career Vedha</h2>
                            <p className="highlight-quote" style={{ fontStyle: 'italic', fontWeight: '600', color: 'var(--primary-purple, #6a1b9a)', fontSize: '1.2rem', marginTop: '10px' }}>
                                "Tamaso Ma Jyotirgamaya" (From darkness, lead me to light.)
                            </p>
                            <p>
                                A strong society is built when individuals are not just educated, but also informed, skilled, and opportunity-ready.
                            </p>
                            <p>
                                Career Vedha enables this by connecting education with careers, preparation with opportunities, and skills with meaningful outcomes.
                            </p>
                            <p>
                                When these elements come together, individuals grow with clarity, families gain confidence, and society progresses with capable and informed people.
                            </p>
                        </section>

                        <section>
                            <h2>Our Vision</h2>
                            <p>
                                To build a platform where education, preparation, careers, and opportunities come together — enabling every learner to move forward with clarity, confidence, and purpose.
                            </p>
                            <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                                Because true progress happens when learning is connected to opportunity.
                            </p>
                        </section>

                        <section>
                            <p>
                                For any queries, contact: <strong>Contact@careervedha.com</strong>
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
