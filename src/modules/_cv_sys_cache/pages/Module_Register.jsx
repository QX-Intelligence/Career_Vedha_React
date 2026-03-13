import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { User, Mail, ShieldCheck, ArrowRight, ArrowLeft, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getUserContext } from '../../../services/api';
import { useSnackbar } from '../../../context/SnackbarContext';

const Module_Register = () => {
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'STUDENT'  // E-store users always register as STUDENT
    });
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { showSnackbar } = useSnackbar();
    const otpInputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        const { isAuthenticated } = getUserContext();
        if (isAuthenticated) {
            navigate('/e-store', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        if (step === 2 && otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
        }
    }, [step]);


    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        if (!formData.email || !formData.firstName || !formData.lastName) {
            showSnackbar('Please fill in all details', 'warning');
            setLoading(false);
            return;
        }

        try {
            await api.post('/registersendotp', null, { params: { email: formData.email } });
            setStep(2);
            setResendTimer(30);
            setOtp(new Array(6).fill(""));
            showSnackbar('OTP sent successfully', 'success');
        } catch (err) {
            showSnackbar(err.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        const otpString = otp.join("");
        if (otpString.length !== 6) {
            showSnackbar('Invalid OTP', 'warning');
            setLoading(false);
            return;
        }

        try {
            await api.post('/registeruser', { ...formData, otp: otpString }, { timeout: 60000 });
            showSnackbar('Registration successful! Redirecting...', 'success');
            setTimeout(() => navigate('/e-store/login'), 2000);
        } catch (err) {
            showSnackbar(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.value && index < 5) otpInputRefs.current[index + 1].focus();
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) otpInputRefs.current[index - 1].focus();
    };

    return (
        <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', fontFamily: "'Playfair Display', serif" }}>
            <Motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                    maxWidth: '550px', 
                    width: '100%', 
                    background: '#1a1a1a', 
                    padding: '3.5rem', 
                    borderRadius: '2.5rem',
                    border: '1px solid #222',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <UserPlus size={32} color="#111" />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p style={{ color: '#888', fontFamily: 'sans-serif', fontSize: '0.95rem' }}>Join our community of book lovers</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <label style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>First Name</label>
                                <input type="text" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', padding: '1.1rem', background: '#222', border: '1px solid #333', borderRadius: '0.85rem', color: '#fff', outline: 'none', fontFamily: 'sans-serif' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <label style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Last Name</label>
                                <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', padding: '1.1rem', background: '#222', border: '1px solid #333', borderRadius: '0.85rem', color: '#fff', outline: 'none', fontFamily: 'sans-serif' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <label style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</label>
                            <input type="email" name="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '1.1rem', background: '#222', border: '1px solid #333', borderRadius: '0.85rem', color: '#fff', outline: 'none', fontFamily: 'sans-serif' }} />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                marginTop: '1rem',
                                padding: '1.25rem', 
                                background: '#D4A843', 
                                color: '#111', 
                                border: 'none', 
                                borderRadius: '1rem', 
                                fontWeight: 800, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 10px 20px rgba(212, 168, 67, 0.2)'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Email & Continue <ArrowRight size={20} /></>}
                        </button>

                        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
                            Already a member? <Link to="/e-store/login" style={{ color: '#D4A843', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                         <div className="store-otp-grid" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={e => handleOtpChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    ref={el => otpInputRefs.current[index] = el}
                                    disabled={loading}
                                    style={{ width: '45px', height: '55px', background: '#222', border: '1px solid #333', borderRadius: '0.75rem', color: '#fff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'sans-serif' }}
                                    className="store-otp-input"
                                />
                            ))}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            {resendTimer > 0 ? (
                                <p style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'sans-serif' }}>Resend in {resendTimer}s</p>
                            ) : (
                                <button type="button" onClick={handleSendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: '#D4A843', fontWeight: 600, cursor: 'pointer' }}>Resend Code</button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={() => setStep(1)} disabled={loading} style={{ flex: 1, padding: '1.25rem', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '1rem', fontWeight: 700, cursor: 'pointer' }}>Edit Data</button>
                            <button type="submit" disabled={loading} style={{ flex: 2, padding: '1.25rem', background: '#D4A843', color: '#111', border: 'none', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer' }}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                            </button>
                        </div>
                    </form>
                )}
            </Motion.div>
        </div>
    );
};

export default Module_Register;
