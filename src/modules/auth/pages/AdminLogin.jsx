import React, { useState, useEffect, useRef } from 'react';
import api, { setUserContext, getUserContext } from '../../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from '../../../context/SnackbarContext';
// Styles are now in index.css

const AdminLogin = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { showSnackbar } = useSnackbar();
    const otpInputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        const { isAuthenticated, role } = getUserContext();
        if (isAuthenticated && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
            showSnackbar('You are already logged in.', 'info');
            navigate('/dashboard', { replace: true });
        }
    }, [navigate, showSnackbar]);

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
        e.preventDefault();
        setLoading(true);

        if (!email) {
            showSnackbar('Please enter your email address', 'warning');
            setLoading(false);
            return;
        }

        try {
            await api.post('/login/send-otp', null, {
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

            const { accessToken, role, email: userEmail, firstName, lastName, status } = response.data;

            // Security Check
            if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                showSnackbar('Access Denied. Admins only.', 'error');
                setLoading(false);
                return;
            }

            setUserContext(accessToken, role, userEmail, firstName, lastName, status);
            showSnackbar('Login successful!', 'success');

            setTimeout(() => {
                navigate('/dashboard');
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
        <div className="auth-wrapper">
            <div className="login-split-container">
                {/* Left Side - Branding */}
                <div className="brand-side">
                    <div className="brand-content">
                        <div className="brand-logo">
                            <i className="fas fa-shield-halved"></i>
                        </div>
                        <h1>Admin Portal</h1>
                        <p className="brand-subtitle">Secure Access for Career Vedha</p>
                        <div className="brand-features">
                            <div className="feature-row">
                                <i className="fas fa-users-cog"></i>
                                <span>User Management</span>
                            </div>
                            <div className="feature-row">
                                <i className="fas fa-chart-pie"></i>
                                <span>Analytics & Reports</span>
                            </div>
                            <div className="feature-row">
                                <i className="fas fa-lock"></i>
                                <span>Secure Platform</span>
                            </div>
                        </div>
                    </div>
                    <div className="brand-overlay"></div>
                </div>

                {/* Right Side - Form */}
                <div className="form-side">
                    <div className="form-content-box">
                        <div className="form-header">
                            <h2>{step === 1 ? 'Admin Login' : 'Verification'}</h2>
                            <p>{step === 1 ? 'Enter your authorized email' : `Enter the OTP sent to ${email}`}</p>
                        </div>

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="login-form">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-group">
                                        <i className="fas fa-envelope input-icon"></i>
                                        <input
                                            type="email"
                                            placeholder="admin@careervedha.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                                </button>

                                <div className="form-footer-link">
                                    <p>New Admin? <Link to="/admin-register">Request Access</Link></p>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="login-form">
                                <div className="otp-container">
                                    {otp.map((data, index) => (
                                        <input
                                            className="otp-field"
                                            type="text"
                                            name="otp"
                                            maxLength="1"
                                            key={index}
                                            value={data}
                                            onChange={e => handleOtpChange(e.target, index)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            onPaste={handlePaste}
                                            ref={el => otpInputRefs.current[index] = el}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>

                                <div className="resend-container">
                                    {resendTimer > 0 ? (
                                        <span className="timer">Resend code in {resendTimer}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-text"
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                        >
                                            Resend Verification Code
                                        </button>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setStep(1);
                                            setOtp(new Array(6).fill(""));
                                        }}
                                        disabled={loading}
                                    >
                                        Back
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Verifying...' : 'Verify & Login'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
