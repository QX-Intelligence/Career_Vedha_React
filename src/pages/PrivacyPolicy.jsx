import React, { useEffect } from 'react';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import ContactForm from '../components/ui/ContactForm';
import SEO from '../components/seo/SEO';
import '../styles/TermsAndConditions.css';

const PrivacyPolicy = () => {
    const [showContactForm, setShowContactForm] = React.useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const lastUpdated = "April 28, 2026";

    return (
        <div className="page-wrapper">
            <SEO
                title="Privacy Policy"
                description="Read Career Vedha's Privacy Policy to understand how we collect, use, and protect your personal information, cookies, and advertising data."
                url="https://careervedha.com/privacy-policy"
            />
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
                            <h2>1. Introduction</h2>
                            <p>
                                Welcome to Career Vedha ("we", "us", or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong>careervedha.com</strong>.
                            </p>
                            <p>
                                Please read this policy carefully. If you disagree with its terms, please discontinue use of our site.
                            </p>
                        </section>

                        <section>
                            <h2>2. Information We Collect</h2>
                            <p>We may collect the following categories of personal information:</p>
                            <ul>
                                <li><strong>Identity Data:</strong> Name, username, or similar identifier when you register an account.</li>
                                <li><strong>Contact Data:</strong> Email address when you register, contact us, or subscribe to notifications.</li>
                                <li><strong>Technical Data:</strong> Internet Protocol (IP) address, browser type and version, time zone setting, browser plug-in types, operating system, and platform.</li>
                                <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited, time spent, and clicks.</li>
                                <li><strong>Log Data:</strong> Our servers automatically record information including your IP address, browser type, referring/exit pages, and date/time stamps.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>3. How We Collect Your Information</h2>
                            <ul>
                                <li><strong>Direct interactions:</strong> When you register, fill out a contact form, or communicate with us.</li>
                                <li><strong>Automated technologies:</strong> Cookies, web beacons, pixels, and similar tracking technologies as you interact with our website.</li>
                                <li><strong>Third parties:</strong> Analytics and advertising partners such as Google Analytics and Google AdSense.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>4. Cookies and Tracking Technologies</h2>
                            <p>
                                We use cookies and similar tracking technologies to track activity on our site and hold certain information. Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.
                            </p>
                            <p>Types of cookies we use:</p>
                            <ul>
                                <li><strong>Essential Cookies:</strong> Necessary for the website to function properly (e.g., session management, authentication).</li>
                                <li><strong>Analytics Cookies:</strong> Used by Google Analytics (with cookie <code>_ga</code>, <code>_gid</code>) to understand how visitors interact with our website. Data is aggregated and anonymized.</li>
                                <li><strong>Advertising Cookies:</strong> Used by Google AdSense (including the DoubleClick cookie) to serve personalized ads based on your interests and browsing history across websites.</li>
                                <li><strong>Preference Cookies:</strong> Used to remember your preferences such as language selection.</li>
                            </ul>
                            <p>
                                You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our site may not function properly.
                            </p>
                        </section>

                        <section>
                            <h2>5. Google AdSense and Advertising</h2>
                            <p>
                                We use Google AdSense to display advertisements on our website. Google AdSense uses cookies, including the DoubleClick cookie, to serve ads based on your prior visits to our website and other websites on the Internet.
                            </p>
                            <p>
                                Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet. Users may opt out of personalized advertising by visiting:
                                <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer"> Google Ads Settings</a>.
                            </p>
                            <p>
                                For more information on how Google uses data when you use our site, please visit: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data from sites that use Google services</a>.
                            </p>
                        </section>

                        <section>
                            <h2>6. Google Analytics</h2>
                            <p>
                                We use Google Analytics to analyze the use of our website. Google Analytics gathers information about website use by means of cookies. The information gathered is used to create reports about the use of our website.
                            </p>
                            <p>
                                Google's privacy policy is available at: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>. You can opt out of Google Analytics tracking by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
                            </p>
                        </section>

                        <section>
                            <h2>7. Payment Processing (Razorpay)</h2>
                            <p>
                                For any paid services or products offered through Career Vedha, we use Razorpay as our payment processor. When you make a payment, your payment information (such as card details) is processed directly by Razorpay and is not stored on our servers.
                            </p>
                            <p>
                                Razorpay's privacy policy is available at: <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">https://razorpay.com/privacy/</a>.
                            </p>
                        </section>

                        <section>
                            <h2>8. How We Use Your Information</h2>
                            <p>We use the information we collect for the following purposes:</p>
                            <ul>
                                <li>To provide, operate, and maintain our website and services.</li>
                                <li>To improve, personalize, and expand our website.</li>
                                <li>To understand and analyze how you use our website.</li>
                                <li>To develop new products, services, features, and functionality.</li>
                                <li>To communicate with you, including for customer service and support.</li>
                                <li>To send you emails or notifications (only if you have opted in).</li>
                                <li>To find and prevent fraud and ensure security.</li>
                                <li>To serve relevant advertisements via Google AdSense.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>9. Data Sharing with Third Parties</h2>
                            <p>We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
                            <ul>
                                <li><strong>Google LLC</strong> — for analytics (Google Analytics) and advertising (Google AdSense).</li>
                                <li><strong>Razorpay Software Pvt. Ltd.</strong> — for payment processing.</li>
                                <li><strong>Hosting/Infrastructure providers</strong> — who host our website and services under strict confidentiality obligations.</li>
                                <li><strong>Legal authorities</strong> — when required by law, court order, or governmental regulation.</li>
                            </ul>
                            <p>All third-party service providers are required to take appropriate security measures to protect your personal data.</p>
                        </section>

                        <section>
                            <h2>10. Data Retention</h2>
                            <p>
                                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                            </p>
                            <ul>
                                <li><strong>Account data:</strong> Retained for the duration of your account and for a reasonable period thereafter.</li>
                                <li><strong>Log data:</strong> Retained for up to 90 days for security and debugging purposes.</li>
                                <li><strong>Analytics data:</strong> Retained per Google Analytics' standard retention settings (26 months by default).</li>
                            </ul>
                        </section>

                        <section>
                            <h2>11. Your Data Rights (GDPR / Indian IT Act)</h2>
                            <p>Depending on your location and applicable law, you may have the following rights regarding your personal data:</p>
                            <ul>
                                <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                                <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
                                <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data.</li>
                                <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service.</li>
                                <li><strong>Right to Object:</strong> Object to processing of your data for marketing purposes.</li>
                                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
                            </ul>
                            <p>To exercise any of these rights, please contact us at <strong>Contact@careervedha.com</strong>. We will respond within 30 days.</p>
                        </section>

                        <section>
                            <h2>12. Children's Privacy</h2>
                            <p>
                                Career Vedha is intended for users who are 13 years of age or older. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at <strong>Contact@careervedha.com</strong> so we can take appropriate action.
                            </p>
                        </section>

                        <section>
                            <h2>13. Security of Your Information</h2>
                            <p>
                                We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the information you provide, please be aware that no security measures are perfect or impenetrable. No method of transmission over the Internet or method of electronic storage is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2>14. Third-Party Websites</h2>
                            <p>
                                Our website may contain links to third-party websites (e.g., official recruitment portals, government sites, news sources). This Privacy Policy does not apply to those third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
                            </p>
                        </section>

                        <section>
                            <h2>15. Changes to This Privacy Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the "Last Updated" date at the top of this page. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the site after changes are posted constitutes your acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h2>16. Contact Us</h2>
                            <p>
                                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <p>
                                <strong>Career Vedha</strong><br />
                                Email: <strong>Contact@careervedha.com</strong><br />
                                Location: Telangana, India
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
