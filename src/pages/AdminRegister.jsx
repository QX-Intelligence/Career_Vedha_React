import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import CustomSelect from '../components/ui/CustomSelect';
// Styles are now in index.css

const AdminRegister = () => {
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '' // Default will be set after fetching
    });
    const [roles, setRoles] = useState([]);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { showSnackbar } = useSnackbar();
    const otpInputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 2 && otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
        }
    }, [step]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                // Use the public active roles endpoint
                console.log("Fetching active roles...");
                const response = await api.get('/get-active-roles');
                console.log("Fetched active roles:", response.data);

                let fetchedRoles = Array.isArray(response.data) ? response.data : [];

                // Normalize to strings if objects are returned
                fetchedRoles = fetchedRoles.map(r => {
                    if (typeof r === 'string') return r;
                    if (typeof r === 'object' && r !== null && r.roleName) return r.roleName;
                    return null;
                }).filter(Boolean);

                if (fetchedRoles.length === 0) {
                    // If API returns empty, fallback to standard roles but warn
                    console.warn("API returned no roles, using default list.");
                    fetchedRoles = ['STUDENT', 'PUBLISHER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN'];
                }

                setRoles(fetchedRoles);

                // Set default selection
                if (fetchedRoles.includes('STUDENT')) {
                    setFormData(prev => ({ ...prev, role: 'STUDENT' }));
                } else if (fetchedRoles.length > 0) {
                    setFormData(prev => ({ ...prev, role: fetchedRoles[0] }));
                }
            } catch (err) {
                console.error("Failed to fetch roles, falling back:", err);
                // Fallback to standard list if API fails completely
                const defaultRoles = ['STUDENT', 'PUBLISHER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN'];
                setRoles(defaultRoles);
                setFormData(prev => ({ ...prev, role: 'STUDENT' }));
            }
        };
        fetchRoles();
    }, []);

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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.email) {
            showSnackbar('Please enter your email address', 'warning');
            setLoading(false);
            return;
        }

        try {
            await api.post('/registersendotp', null, {
                params: { email: formData.email }
            });

            setStep(2);
            setResendTimer(30);
            setOtp(new Array(6).fill("")); // Reset OTP fields
            showSnackbar('OTP sent successfully', 'success');
        } catch (err) {
            console.error(err);
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
            showSnackbar('Please enter a valid 6-digit OTP', 'warning');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                otp: otpString
            };
            console.log("Sending registration payload:", payload);

            await api.post('/registeruser', payload, {
                timeout: 60000 // Allow 60s for extremely slow SMTP/Backend
            });

            showSnackbar('Registration submitted for approval!', 'success');

            setTimeout(() => {
                navigate('/admin-login');
            }, 2000);

        } catch (err) {
            console.error("Registration error:", err);
            let msg = 'Registration failed';

            if (err.code === 'ECONNABORTED') {
                msg = 'Request timed out. The server might be busy sending emails. Please check your email inbox shortly.';
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }

            showSnackbar(msg, 'error');
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
                            <i className="fas fa-user-plus"></i>
                        </div>
                        <h1>Admin Registration</h1>
                        <p className="brand-subtitle">Join the Admin Team</p>
                        <div className="brand-features">
                            <div className="feature-row">
                                <i className="fas fa-users-cog"></i>
                                <span>Platform Management</span>
                            </div>
                            <div className="feature-row">
                                <i className="fas fa-shield-alt"></i>
                                <span>High Security</span>
                            </div>
                        </div>
                    </div>
                    <div className="brand-overlay"></div>
                </div>

                {/* Right Side - Form */}
                <div className="form-side">
                    <div className="form-content-box">
                        <div className="form-header">
                            <h2>{step === 1 ? 'Create Admin Account' : 'Verify Email'}</h2>
                            <p>{step === 1 ? 'Fill in your details to get started' : `Enter the OTP sent to ${formData.email}`}</p>
                        </div>

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="login-form">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <div className="input-group">
                                        <i className="fas fa-user input-icon"></i>
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Last Name</label>
                                    <div className="input-group">
                                        <i className="fas fa-user input-icon"></i>
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <CustomSelect
                                        label="I am a..."
                                        value={formData.role}
                                        onChange={(val) => setFormData({ ...formData, role: val })}
                                        options={roles.map(r => ({
                                            value: r,
                                            label: `${r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}${r !== 'STUDENT' ? ' (Requires Approval)' : ''}`
                                        }))}
                                        placeholder="Select your role..."
                                        icon="fas fa-users"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-group">
                                        <i className="fas fa-envelope input-icon"></i>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="you@careervedha.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>



                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                                </button>

                                <div className="form-footer-link">
                                    <p>Already have an account? <Link to="/admin-login">Login here</Link></p>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="login-form">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-group">
                                        <i className="fas fa-lock input-icon"></i>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled={true}
                                        />
                                    </div>
                                </div>

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
                                        className="btn-secondary"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        type="button"
                                    >
                                        Edit Details
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register'}
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

export default AdminRegister;
