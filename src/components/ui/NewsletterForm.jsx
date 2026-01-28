import React, { useState } from 'react';
import { newsletterService } from '../../services';

const NewsletterForm = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage('Please enter your email');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // When backend is ready, uncomment this:
            // await newsletterService.subscribe(email);
            // setMessage('Successfully subscribed!');

            // For now, show alert
            alert(`Thank you for subscribing with: ${email}`);
            setEmail('');
        } catch (error) {
            setMessage('Subscription failed. Please try again.');
            console.error('Newsletter subscription error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sidebar-widget newsletter-widget">
            <h3 className="widget-title">
                <i className="fas fa-paper-plane"></i>
                Newsletter
            </h3>
            <p className="newsletter-desc">Subscribe to get daily updates straight to your inbox.</p>
            <form className="newsletter-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Subscribe'}
                    </button>
                </div>
            </form>
            {message && <p className="form-message">{message}</p>}
        </div>
    );
};

export default NewsletterForm;
