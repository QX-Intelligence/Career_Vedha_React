import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Rocket, Sparkles, Package } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';

const ComingSoon = () => {
    const navigate = useNavigate();
    const activeLanguage = localStorage.getItem('preferredLanguage') || 'telugu';

    return (
        <div className="coming-soon-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <TopBar />
            <Header activeLanguage={activeLanguage} onLanguageChange={() => {}} />
            <PrimaryNav />

            <main style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
                padding: '40px 20px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decorative Elements */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-5%',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'var(--primary-yellow)',
                        filter: 'blur(100px)',
                        zIndex: 0
                    }}
                />
                
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.05, 0.15, 0.05],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    style={{
                        position: 'absolute',
                        bottom: '-10%',
                        left: '-5%',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                        filter: 'blur(120px)',
                        zIndex: 0
                    }}
                />

                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{ 
                            display: 'inline-flex', 
                            padding: '20px', 
                            borderRadius: '30px', 
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '32px',
                            color: 'var(--primary-yellow)'
                        }}>
                            <ShoppingCart size={48} strokeWidth={1.5} />
                        </div>

                        <h1 style={{ 
                            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
                            fontWeight: 900, 
                            marginBottom: '16px',
                            letterSpacing: '-2px',
                            background: 'linear-gradient(to bottom, #fff 40%, #9ca3af 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.1
                        }}>
                            E-Store <br />
                            <span style={{ color: 'var(--primary-yellow)', WebkitTextFillColor: 'var(--primary-yellow)' }}>Coming Soon</span>
                        </h1>

                        <p style={{ 
                            fontSize: '1.2rem', 
                            color: '#9ca3af', 
                            maxWidth: '600px', 
                            margin: '0 auto 48px',
                            lineHeight: 1.6
                        }}>
                            We're crafting a premium marketplace experience for all your educational resources, courses, and tools. Something amazing is in the works!
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px 32px',
                                    borderRadius: '50px',
                                    background: 'var(--primary-yellow)',
                                    color: '#000',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    boxShadow: '0 10px 25px rgba(255, 193, 7, 0.3)'
                                }}
                            >
                                <ArrowLeft size={20} />
                                Back to Home
                            </motion.button>

                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px 32px',
                                borderRadius: '50px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#fff',
                                fontWeight: 600,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '1rem'
                            }}>
                                <Rocket size={20} className="text-yellow-400" />
                                Launching Q2 2026
                            </div>
                        </div>
                    </motion.div>

                        <div style={{ 
                            marginTop: '80px', 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '24px',
                            maxWidth: '900px',
                            marginInline: 'auto'
                        }}>
                            {[
                                { icon: <Sparkles size={24} />, title: "Premium Quality", desc: "Hand-picked resources" },
                                { icon: <Package size={24} />, title: "Instant Access", desc: "Digital delivery in seconds" },
                                { icon: <ShoppingCart size={24} />, title: "Secure Checkout", desc: "Always safe and encrypted" }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    style={{
                                        padding: '24px',
                                        borderRadius: '24px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ color: 'var(--primary-yellow)', marginBottom: '12px' }}>{feature.icon}</div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{feature.title}</h3>
                                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ComingSoon;
