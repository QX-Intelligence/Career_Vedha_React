import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './modules/auth/pages/AdminLogin';
import AdminRegister from './modules/auth/pages/AdminRegister';
import Dashboard from './modules/admin/pages/Dashboard';
import Exam from './modules/exam/pages/Exam';
import UserManagement from './modules/admin/pages/UserManagement';
import ArticleDetail from './modules/articles/pages/ArticleDetail';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import api, { setUserContext } from './services/api';
import './styles/index.css';
import { SnackbarProvider } from './context/SnackbarContext';
import { HelmetProvider } from 'react-helmet-async';
import TooltipManager from './components/ui/TooltipManager';
import MobileLayout from './components/layout/MobileLayout';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

import JobsList from './modules/jobs/pages/JobsList';
import JobDetail from './modules/jobs/pages/JobDetail';
import JobsManagement from './modules/jobs/pages/JobsManagement';
import JobEditor from './modules/jobs/pages/JobEditor';
import ArticleEditor from './modules/articles/pages/ArticleEditor';
import TaxonomyManagement from './modules/admin/pages/TaxonomyManagement';
import MediaManagement from './modules/admin/pages/MediaManagement';

function App() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Always attempt to refresh on startup to restore in-memory context
                const response = await api.post('/refresh', {});
                const { accessToken, role, email, firstName, lastName, status } = response.data;
                setUserContext(accessToken, role, email, firstName, lastName, status);
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
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <HelmetProvider>
                <SnackbarProvider>
                    <TooltipManager />
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <div className="App">
                            <MobileLayout>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/admin-login" element={<AdminLogin />} />
                                    <Route path="/admin-register" element={<AdminRegister />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/exam" element={<Exam />} />
                                    <Route path="/user-management" element={<UserManagement />} />
                                    <Route path="/article/:section/:slug" element={<ArticleDetail />} />
                                    
                                    {/* Public Job Board */}
                                    <Route path="/jobs" element={<JobsList />} />
                                    <Route path="/jobs/:slug" element={<JobDetail />} />

                                    {/* CMS Jobs Management */}
                                    <Route path="/cms/jobs" element={<JobsManagement />} />
                                    <Route path="/cms/jobs/new" element={<JobEditor />} />
                                    <Route path="/cms/jobs/edit/:id" element={<JobEditor />} />
                                    <Route path="/cms/articles/new" element={<ArticleEditor />} />
                                    <Route path="/cms/articles/edit/:section/:id" element={<ArticleEditor />} />
                                    <Route path="/cms/articles/edit/:id" element={<ArticleEditor />} />
                                    <Route path="/cms/taxonomy" element={<TaxonomyManagement />} />
                                    <Route path="/cms/media" element={<MediaManagement />} />

                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </MobileLayout>
                        </div>
                    </Router>
                </SnackbarProvider>
            </HelmetProvider>
        </QueryClientProvider>
    );
}

export default App;
