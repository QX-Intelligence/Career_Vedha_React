import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api, { setUserContext, getUserContext } from '../../../services/api';
import { useSnackbar } from '../../../context/SnackbarContext';

const Module_Login = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState('');
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

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        if (!email) {
            showSnackbar('Please enter your email address', 'warning');
            setLoading(false);
            return;
        }

        try {
            await api.post('/login/send-otp', {}, {
                params: { email }
            });

            setStep(2);
            setResendTimer(30);
            setOtp(new Array(6).fill(""));
            showSnackbar('OTP sent successfully', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        const otpString = otp.join("");
        if (otpString.length !== 6) {
            showSnackbar('Please enter a valid 6-digit OTP', 'warning');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/login', {
                email,
                otp: otpString
            });

            const { accessToken, role } = response.data;

            if (!accessToken) {
                showSnackbar('Login failed. No token received.', 'error');
                setLoading(false);
                return;
            }

            setUserContext(accessToken, role, email);
            showSnackbar('Login successful!', 'success');

            setTimeout(() => {
                navigate('/e-store', { replace: true });
            }, 1000);

        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.message || 'Invalid OTP', 'error');
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
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        if (data.length === 6 && data.every(char => !isNaN(char))) {
            setOtp(data);
            otpInputRefs.current[5].focus();
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#FDFBF7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: "'Playfair Display', serif"
        }}>
            <Motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    maxWidth: '450px', 
                    width: '100%', 
                    background: '#FFFFFF', 
                    padding: '3rem', 
                    borderRadius: '2rem',
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#62269E', 
                        borderRadius: '1.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 20px rgba(98, 38, 158, 0.2)'
                    }}>
                        <ShieldCheck size={32} color="#FDFBF7" />
                    </div>
                    <h2 style={{ color: '#0F172A', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {step === 1 ? 'Welcome Back' : 'Verify Account'}
                    </h2>
                    <p style={{ color: '#64748B', fontFamily: 'sans-serif', fontSize: '0.95rem' }}>
                        {step === 1 ? 'Login to continue your shopping journey' : `Enter the 6-digit code sent to ${email}`}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#62269E' }} />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    style={{ 
                                        width: '100%', 
                                        padding: '1.25rem 1.25rem 1.25rem 3rem', 
                                        background: '#FFFFFF', 
                                        border: '1px solid #E2E8F0', 
                                        borderRadius: '1rem', 
                                        color: '#0F172A',
                                        fontSize: '1rem',
                                        fontFamily: 'sans-serif',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#62269E'}
                                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                padding: '1.25rem', 
                                background: '#62269E', 
                                color: '#FDFBF7', 
                                border: 'none', 
                                borderRadius: '1rem', 
                                fontWeight: 800, 
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 10px 20px rgba(98, 38, 158, 0.2)'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Send Verification <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
                                Don't have an account? <Link to="/e-store/register" style={{ color: '#62269E', textDecoration: 'none', fontWeight: 600 }}>Register Now</Link>
                            </p>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="store-otp-grid" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={e => handleOtpChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    ref={el => otpInputRefs.current[index] = el}
                                    style={{ 
                                        width: '45px', 
                                        height: '55px', 
                                        background: '#FFFFFF', 
                                        border: '1px solid #E2E8F0', 
                                        borderRadius: '0.75rem', 
                                        color: '#0F172A',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        textAlign: 'center',
                                        outline: 'none',
                                        fontFamily: 'sans-serif'
                                    }}
                                    className="store-otp-input"
                                />
                            ))}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            {resendTimer > 0 ? (
                                <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'sans-serif' }}>Resend code in {resendTimer}s</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    style={{ background: 'none', border: 'none', color: '#62269E', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Resend Verification Code
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={loading}
                                style={{ 
                                    flex: 1,
                                    padding: '1.25rem', 
                                    background: '#FFFFFF', 
                                    color: '#64748B', 
                                    border: '1px solid #E2E8F0', 
                                    borderRadius: '1rem', 
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    flex: 2,
                                    padding: '1.25rem', 
                                    background: '#62269E', 
                                    color: '#FDFBF7', 
                                    border: 'none', 
                                    borderRadius: '1rem', 
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Login'}
                            </button>
                        </div>
                    </form>
                )}
            </Motion.div>
        </div>
    );
};

export default Module_Login;
