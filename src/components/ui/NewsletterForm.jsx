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
        <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter</h3>
            <p>Subscribe to get daily updates</p>
            <form className="newsletter-form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
            </form>
            {message && <p className="form-message">{message}</p>}
        </div>
    );
};

export default NewsletterForm;
