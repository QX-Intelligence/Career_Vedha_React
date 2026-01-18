import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import Dashboard from './pages/Dashboard';
import Exam from './pages/Exam';
import UserManagement from './pages/UserManagement';
import api, { setUserContext } from './services/api';
import './styles/index.css';
import { SnackbarProvider } from './context/SnackbarContext';

function App() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Always attempt to refresh on startup to restore in-memory context
                const response = await api.post('/refresh', {});
                const { accessToken, role, email } = response.data;
                setUserContext(accessToken, role, email);
            } catch (err) {
                // If refresh fails, it just means no active session
                console.log("No active session found on startup");
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAuth();
    }, []);

    if (isInitializing) {
        return (
            <div className="premium-splash-screen">
                <div className="splash-content">
                    <div className="splash-logo">
                        <div className="logo-icon-container">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div className="logo-text-container">
                            <h1>CAREER VEDHA</h1>
                            <p>ADVANCED LEARNING PORTAL</p>
                        </div>
                    </div>
                    <div className="splash-loader">
                        <div className="loader-track">
                            <div className="loader-fill"></div>
                        </div>
                        <span className="loader-text">Initializing Secure Session...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SnackbarProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/admin-login" element={<AdminLogin />} />
                        <Route path="/admin-register" element={<AdminRegister />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/exam" element={<Exam />} />
                        <Route path="/user-management" element={<UserManagement />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </SnackbarProvider>
    );
}

export default App;
