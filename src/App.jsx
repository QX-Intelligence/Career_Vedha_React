import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';

// Lazy load major route components
const ArticlesPage = lazy(() => import('./pages/Articles'));
const NewsPage = lazy(() => import('./pages/News'));
const AdminLogin = lazy(() => import('./modules/auth/pages/AdminLogin'));
const AdminRegister = lazy(() => import('./modules/auth/pages/AdminRegister'));
const Dashboard = lazy(() => import('./modules/admin/pages/Dashboard'));
const Exam = lazy(() => import('./modules/exam/pages/Exam'));
const UserManagement = lazy(() => import('./modules/admin/pages/UserManagement'));
const ArticleDetail = lazy(() => import('./modules/articles/pages/ArticleDetail'));

// Additional Lazy Loads
const JobsList = lazy(() => import('./modules/jobs/pages/JobsList'));
const JobDetail = lazy(() => import('./modules/jobs/pages/JobDetail'));
const JobsManagement = lazy(() => import('./modules/jobs/pages/JobsManagement'));
const JobEditor = lazy(() => import('./modules/jobs/pages/JobEditor'));
const ArticleEditor = lazy(() => import('./modules/articles/pages/ArticleEditor'));
const TaxonomyManagement = lazy(() => import('./modules/admin/pages/TaxonomyManagement'));
const MediaManagement = lazy(() => import('./modules/admin/pages/MediaManagement'));
const AcademicsHome = lazy(() => import('./modules/academics/pages/AcademicsHome'));
const SubjectDetail = lazy(() => import('./modules/academics/pages/SubjectDetail'));
const MaterialDetail = lazy(() => import('./modules/academics/pages/MaterialDetail'));
const AcademicsManagement = lazy(() => import('./modules/admin/pages/AcademicsManagement'));
const AcademicExamsPage = lazy(() => import('./pages/AcademicExamsPage'));
const CurrentAffairs = lazy(() => import('./pages/CurrentAffairs'));
const CurrentAffairsManagement = lazy(() => import('./modules/admin/pages/CurrentAffairsManagement'));
const PapersManagement = lazy(() => import('./modules/admin/pages/PapersManagement'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const PaperViewer = lazy(() => import('./pages/PaperViewer'));
const QuestionPapersPage = lazy(() => import('./pages/QuestionPapersPage'));
const StudyMaterialsPage = lazy(() => import('./pages/StudyMaterialsPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import api, { setUserContext } from './services/api';
import './styles/index.css';
import './styles/contact-papers.css';
import './styles/paper-viewer.css';
import { SnackbarProvider } from './context/SnackbarContext';
import { HelmetProvider } from 'react-helmet-async';
import TooltipManager from './components/ui/TooltipManager';
import MobileLayout from './components/layout/MobileLayout';
import ScrollToHashElement from './components/utils/ScrollToHashElement';
import ScrollRestoration from './components/utils/ScrollRestoration';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
            gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory longer
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on component mount if data is fresh
            refetchOnReconnect: false, // Don't refetch on reconnect if data is fresh
        },
        mutations: {
            retry: 1,
        },
    },
});

import { MODULES } from './config/accessControl.config';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Skeleton from './components/ui/Skeleton';

const PageLoader = () => (
    <div className="premium-splash-screen">
        <div className="splash-content">
            <div className="splash-loader">
                <div className="loader-track">
                    <div className="loader-fill"></div>
                </div>
                <span className="loader-text">Loading Content...</span>
            </div>
        </div>
    </div>
);

const SecurityWarning = ({ visible }) => {
    if (!visible) return null;
    return (
        <div className="security-warning-overlay">
            <div className="security-warning-card">
                <div className="security-warning-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="security-warning-text">ALERT: Content is protected !!</div>
            </div>
        </div>
    );
};

const SecurityLayer = ({ children }) => {
    const [warningVisible, setWarningVisible] = useState(false);
    const warningTimerRef = React.useRef(null);

    const triggerWarning = React.useCallback(() => {
        setWarningVisible(true);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => {
            setWarningVisible(false);
        }, 2000);
    }, []);

    useEffect(() => {
        const isProduction = import.meta.env.PROD;
        let trapInterval, detectInterval, logInterval;

        const lockUI = () => {
            if (document.getElementById('security-lock')) return;
            document.body.innerHTML = `
                <div id="security-lock" style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;font-family:sans-serif;background:#fff8f8;color:#d32f2f;text-align:center;padding:20px;position:fixed;top:0;left:0;width:100%;z-index:9999999;">
                    <h1 style="font-size:32px;">⚠️ Security Protection Active</h1>
                    <p style="font-size:18px;">Developer Tools are restricted. Please close the console to continue.</p>
                    <button onclick="window.location.reload()" style="padding:12px 30px;cursor:pointer;background:#d32f2f;color:white;border:none;border-radius:8px;font-weight:bold;font-size:16px;">Refresh & Retry</button>
                </div>`;
            // Attempt to break any subsequent script execution
            throw new Error("Security Lock Activated");
        };

        const checkDevTools = () => {
            // 1. Dimension Check (Docked)
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            if (widthThreshold || heightThreshold) lockUI();

            // 2. Timing Check
            const start = performance.now();
            debugger;
            if (performance.now() - start > 100) lockUI();
        };

        // --- AGGRESSIVE PRODUCTION-ONLY TRAPS ---
        if (isProduction) {
            // 1. Continuous Debugger & Timing Trap
            trapInterval = setInterval(() => {
                checkDevTools();
                (function() {
                    (function a() {
                        try {
                            (function b(i) {
                                if (("" + i / i).length !== 1 || i % 20 === 0) {
                                    (function() {}).constructor("debugger")();
                                } else {
                                    debugger;
                                }
                                b(++i);
                            })(0);
                        } catch (e) {
                            setTimeout(a, 50);
                        }
                    })();
                })();
            }, 1000);

            // 2. Object-Getter Detection (Undocked)
            const detector = {
                get id() {
                    lockUI();
                    return "detected";
                }
            };

            detectInterval = setInterval(() => {
                console.log(detector);
                console.clear();
            }, 1500);

            window.addEventListener('resize', checkDevTools);

            // 3. Console Protection
            logInterval = setInterval(() => {
                console.log("%cSecurity: This portal is protected.", "color: red; font-size: 20px; font-weight: bold;");
            }, 5000);
        }

        // --- STANDARD EVENT LISTENERS (Shared) ---
        const handleContextMenu = (e) => {
            e.preventDefault();
            triggerWarning();
        };

        const handleKeyDown = (e) => {
            // Windows/Linux/Mac DevTools, View Source, Save, Print
            const isDevTools = 
                e.keyCode === 123 || 
                ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
                (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
                ((e.ctrlKey || e.metaKey) && e.keyCode === 85) || 
                (e.metaKey && e.altKey && e.keyCode === 85);

            if (isDevTools) {
                e.preventDefault();
                return false;
            }
            
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 83 || e.keyCode === 80)) {
                e.preventDefault();
                triggerWarning();
                return false;
            }
        };

        const dragRef = { x: 0, y: 0, active: false };
        const handleMouseDown = (e) => { dragRef.x = e.clientX; dragRef.y = e.clientY; dragRef.active = true; };
        const handleMouseMove = (e) => {
            if (!dragRef.active) return;
            if (Math.sqrt(Math.pow(e.clientX - dragRef.x, 2) + Math.pow(e.clientY - dragRef.y, 2)) > 10) {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable) {
                    triggerWarning();
                    dragRef.active = false;
                }
            }
        };
        const handleMouseUp = () => { dragRef.active = false; };
        const handleSelectStart = (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable) e.preventDefault();
        };
        const handleCopy = (e) => { e.preventDefault(); triggerWarning(); };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('copy', handleCopy);

        return () => {
            if (trapInterval) clearInterval(trapInterval);
            if (detectInterval) clearInterval(detectInterval);
            if (logInterval) clearInterval(logInterval);
            window.removeEventListener('resize', checkDevTools);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('copy', handleCopy);
        };
    }, [triggerWarning]);

    return (
        <>
            {children}
            <SecurityWarning visible={warningVisible} />
        </>
    );
};

function App() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            // E2E test mock: window.__e2eMockAuth provides persistent state across reloads
            // This is safer than window.__e2eSkipInit as it actually populates the auth context.
            if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && window.__e2eMockAuth) {
                const { accessToken, role, email, firstName, lastName, status, id } = window.__e2eMockAuth;
                setUserContext(accessToken, role, email, firstName, lastName, status, id);
                setIsInitializing(false);
                return;
            }

            // E2E test skip legacy support
            if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && window.__e2eSkipInit) {
                setIsInitializing(false);
                return;
            }
            try {
                // Always attempt to refresh on startup to restore in-memory context
                const response = await api.post('/refresh', {});
                const { accessToken, role } = response.data;
                // Since refresh might not return email, we could potentially get it from a temporary source 
                // but for now we follow the backend which only returns token and role.
                setUserContext(accessToken, role);
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
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            <HelmetProvider>
                <SnackbarProvider>
                    <SecurityLayer>
                        <TooltipManager />
                        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <ScrollRestoration />
                        <ScrollToHashElement />
                        <div className="App">
                            <MobileLayout>
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/admin-login" element={<AdminLogin />} />
                                        <Route path="/admin-register" element={<AdminRegister />} />
                                        
                                        <Route path="/dashboard" element={
                                            <ProtectedRoute>
                                                <Dashboard />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/exam" element={<Exam />} />
                                        
                                        <Route path="/user-management" element={
                                            <ProtectedRoute requireAdmin>
                                                <UserManagement />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/article/:section/:slug" element={<ArticleDetail />} />
                                        <Route path="/news" element={<NewsPage />} />
                                        <Route path="/articles" element={<ArticlesPage />} />
                                        <Route path="/search" element={<SearchResults />} />
                                        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                                        <Route path="/current-affairs" element={<CurrentAffairs />} />
                                        <Route path="/paper-viewer" element={<PaperViewer />} />
                                        <Route path="/question-papers" element={<QuestionPapersPage />} />
                                        <Route path="/study-materials" element={<StudyMaterialsPage />} />
                                        <Route path="/videos/:category" element={<VideosPage />} />
                                        
                                        {/* Public Job Board */}
                                        <Route path="/jobs" element={<JobsList />} />
                                        <Route path="/jobs/:slug" element={<JobDetail />} />

                                        {/* CMS Jobs Management */}
                                        <Route path="/cms/jobs" element={
                                            <ProtectedRoute module={MODULES.JOB_MANAGEMENT}>
                                                <JobsManagement />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/jobs/new" element={
                                            <ProtectedRoute module={MODULES.JOB_MANAGEMENT}>
                                                <JobEditor />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/jobs/edit/:id" element={
                                            <ProtectedRoute module={MODULES.JOB_MANAGEMENT}>
                                                <JobEditor />
                                            </ProtectedRoute>
                                        } />
                                        
                                        {/* CMS Article Management */}
                                        <Route path="/cms/articles/new" element={
                                            <ProtectedRoute module={MODULES.ARTICLE_MANAGEMENT}>
                                                <ArticleEditor />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/articles/edit/:section/:id" element={
                                            <ProtectedRoute module={MODULES.ARTICLE_MANAGEMENT}>
                                                <ArticleEditor />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/articles/edit/:id" element={
                                            <ProtectedRoute module={MODULES.ARTICLE_MANAGEMENT}>
                                                <ArticleEditor />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/cms/taxonomy" element={
                                            <ProtectedRoute module={MODULES.TAXONOMY_MANAGEMENT}>
                                                <TaxonomyManagement />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/cms/media" element={
                                            <ProtectedRoute module={MODULES.MEDIA_MANAGEMENT}>
                                                <MediaManagement />
                                            </ProtectedRoute>
                                        } />

                                        {/* Academics Module Public Routes */}
                                        <Route path="/academics" element={<AcademicsHome />} />
                                        <Route path="/academics/level/:slug" element={<AcademicsHome />} />
                                        <Route path="/academics/subject/:slug" element={<SubjectDetail />} />
                                        <Route path="/academics/material/:slug" element={<MaterialDetail />} />

                                        {/* Academics Module CMS Routes */}
                                        <Route path="/academic-exams" element={<AcademicExamsPage />} />
                                        <Route path="/cms/academics" element={
                                            <ProtectedRoute module={MODULES.ACADEMICS_MANAGEMENT}>
                                                <AcademicsManagement />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/cms/current-affairs" element={
                                            <ProtectedRoute module={MODULES.CURRENT_AFFAIRS_MANAGEMENT}>
                                                <CurrentAffairsManagement />
                                            </ProtectedRoute>
                                        } />
                                        
                                        <Route path="/cms/papers" element={
                                            <ProtectedRoute module={MODULES.PAPERS_MANAGEMENT}>
                                                <PapersManagement />
                                            </ProtectedRoute>
                                        } />

                                        <Route path="/e-store" element={<ComingSoon />} />

                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Suspense>
                            </MobileLayout>
                        </div>
                    </Router>
                </SecurityLayer>
            </SnackbarProvider>
            </HelmetProvider>
        </QueryClientProvider>
    );
}

export default App;
