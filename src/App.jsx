import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { lazyWithRetry } from './utils/lazyLoading';

// Lazy load major route components
const ArticlesPage = lazyWithRetry(() => import('./pages/Articles'));
const NewsPage = lazyWithRetry(() => import('./pages/News'));
const AdminLogin = lazyWithRetry(() => import('./modules/auth/pages/AdminLogin'));
const AdminRegister = lazyWithRetry(() => import('./modules/auth/pages/AdminRegister'));
const Dashboard = lazyWithRetry(() => import('./modules/admin/pages/Dashboard'));
const Exam = lazyWithRetry(() => import('./modules/exam/pages/Exam'));
const UserManagement = lazyWithRetry(() => import('./modules/admin/pages/UserManagement'));
const ArticleDetail = lazyWithRetry(() => import('./modules/articles/pages/ArticleDetail'));

// Additional Lazy Loads
const JobsList = lazyWithRetry(() => import('./modules/jobs/pages/JobsList'));
const JobDetail = lazyWithRetry(() => import('./modules/jobs/pages/JobDetail'));
const JobsManagement = lazyWithRetry(() => import('./modules/jobs/pages/JobsManagement'));
const JobEditor = lazyWithRetry(() => import('./modules/jobs/pages/JobEditor'));

const ArticleEditor = lazyWithRetry(() => import('./modules/articles/pages/ArticleEditor'));
const TaxonomyManagement = lazyWithRetry(() => import('./modules/admin/pages/TaxonomyManagement'));
const MediaManagement = lazyWithRetry(() => import('./modules/admin/pages/MediaManagement'));
const AcademicsHome = lazyWithRetry(() => import('./modules/academics/pages/AcademicsHome'));
const SubjectDetail = lazyWithRetry(() => import('./modules/academics/pages/SubjectDetail'));
const MaterialDetail = lazyWithRetry(() => import('./modules/academics/pages/MaterialDetail'));
const AcademicsManagement = lazyWithRetry(() => import('./modules/admin/pages/AcademicsManagement'));
const AcademicExamsPage = lazyWithRetry(() => import('./pages/AcademicExamsPage'));
const CurrentAffairs = lazyWithRetry(() => import('./pages/CurrentAffairs'));
const CurrentAffairsManagement = lazyWithRetry(() => import('./modules/admin/pages/CurrentAffairsManagement'));
const PapersManagement = lazyWithRetry(() => import('./modules/admin/pages/PapersManagement'));
const ComingSoon = lazyWithRetry(() => import('./pages/ComingSoon'));
const PaperViewer = lazyWithRetry(() => import('./pages/PaperViewer'));
const QuestionPapersPage = lazyWithRetry(() => import('./pages/QuestionPapersPage'));
const StudyMaterialsPage = lazyWithRetry(() => import('./pages/StudyMaterialsPage'));
const SearchResults = lazyWithRetry(() => import('./pages/SearchResults'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'));
const ContactUs = lazyWithRetry(() => import('./pages/ContactUs'));
const Curriculum = lazyWithRetry(() => import('./pages/Curriculum'));
const VideosPage = lazyWithRetry(() => import("./pages/VideosPage"));
const CV_Store_Module = lazyWithRetry(() => import("./modules/_cv_sys_cache/index"));
const EStoreAdminRoot = lazyWithRetry(() => import("./modules/_cv_sys_cache/admin/EStoreAdminRoot"));
const TopStoriesManagement = lazyWithRetry(() => import('./modules/articles/pages/TopStoriesManagement'));
const OurServicesManagement = lazyWithRetry(() => import('./modules/ourServices/pages/OurServicesManagement'));
const OurServicesEditor = lazyWithRetry(() => import('./modules/ourServices/pages/OurServicesEditor'));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import api, { setUserContext, restoreAuthFromStorage } from './services/api';
import './styles/index.css';
import './styles/contact-papers.css';
import './styles/paper-viewer.css';
import { SnackbarProvider } from './context/SnackbarContext';
import { LanguageProvider } from './context/LanguageContext';
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
            refetchOnMount: true,
            refetchOnReconnect: true,
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
            <div className="splash-loading-logo">
                <img 
                    src="/Career Vedha logo1.png" 
                    alt="Career Vedha" 
                    style={{ height: '60px', width: 'auto', marginBottom: '20px' }}
                />
            </div>
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
        // Temporarily disabled devtools protection per user request
        const isProduction = false; // Forced to false
        let trapInterval, detectInterval, logInterval, bgInterval;

        const lockUI = () => {
            if (!isProduction) return;
            // NUCLEAR OPTION: Destroy all data and leave instantly
            try {
                localStorage.clear();
                sessionStorage.clear();
                // Clear all cookies as a best effort
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    const name = cookie.split("=")[0];
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            } catch (e) {}
            
            // Immediate hard redirect to destroy the JS environment and clear Network tab context
            window.location.replace('about:blank');
        };

        const checkDevTools = () => {
            // 1. Dimension Check (Docked Console)
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            if (widthThreshold || heightThreshold) lockUI();
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
                // Timing check without explicit debugger to avoid forced pause window
                // but still detecting active debugging via the getter
                console.log(detector);
                console.clear();
            }, 500);

            window.addEventListener('resize', checkDevTools);
            // Constant background check for docked tools
            const bgInterval = setInterval(checkDevTools, 500); 

            // 3. Console Protection
            logInterval = setInterval(() => {
                console.log("%cSecurity: This portal is protected.", "color: red; font-size: 20px; font-weight: bold;");
            }, 5000);
        }

        // --- STANDARD EVENT LISTENERS (Shared) ---
        const handleContextMenu = (e) => {
            e.preventDefault();
            // Removed triggerWarning() - per user request, right-click should be silently blocked
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

        if (isProduction) {
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('selectstart', handleSelectStart);
            document.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('copy', handleCopy);
        }

        return () => {
            if (trapInterval) clearInterval(trapInterval);
            if (detectInterval) clearInterval(detectInterval);
            if (logInterval) clearInterval(logInterval);
            if (bgInterval) clearInterval(bgInterval);
            window.removeEventListener('resize', checkDevTools);
            if (isProduction) {
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('selectstart', handleSelectStart);
                document.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('copy', handleCopy);
            }
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

            if (restoreAuthFromStorage()) {
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
                        <div style={{ overflow: 'hidden', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img 
                                src="/Career Vedha logo1.png" 
                                alt="Career Vedha" 
                                style={{ height: '60px', width: 'auto', display: 'block' }}
                            />
                        </div>
                        <div className="logo-text-container">
                            <p style={{ letterSpacing: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--cv-primary)', marginTop: '0', marginBottom: '16px' }}>ADVANCED LEARNING PORTAL</p>
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
            <LanguageProvider>
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
                                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                        <Route path="/about" element={<AboutUs />} />
                                        <Route path="/about-us" element={<Navigate to="/about" replace />} />
                                        <Route path="/contact" element={<ContactUs />} />
                                        <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                                        <Route path="/current-affairs" element={<CurrentAffairs />} />
                                        <Route path="/paper-viewer" element={<PaperViewer />} />
                                        <Route path="/question-papers" element={<QuestionPapersPage />} />
                                        <Route path="/study-materials" element={<StudyMaterialsPage />} />
                                        <Route path="/curriculum" element={<Curriculum />} />
                                        <Route path="/videos" element={<VideosPage />} />
                                        <Route path="/e-store/*" element={<CV_Store_Module />} />
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

                                        <Route path="/cms/top-stories" element={
                                            <ProtectedRoute module={MODULES.ARTICLE_MANAGEMENT}>
                                                <TopStoriesManagement />
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
                                        <Route path="/cms/course-materials" element={
                                            <ProtectedRoute module={MODULES.ACADEMICS_MANAGEMENT}>
                                                <AcademicsManagement initialTab="materials" hideOtherTabs={true} />
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

                                        {/* Our Services CMS Routes */}
                                        <Route path="/cms/our-services" element={
                                            <ProtectedRoute module={MODULES.SERVICES_MANAGEMENT}>
                                                <OurServicesManagement />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/our-services/new" element={
                                            <ProtectedRoute module={MODULES.SERVICES_MANAGEMENT}>
                                                <OurServicesEditor />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/cms/our-services/edit/:id" element={
                                            <ProtectedRoute module={MODULES.SERVICES_MANAGEMENT}>
                                                <OurServicesEditor />
                                            </ProtectedRoute>
                                        } />

                                        {/* E-Store Admin - Reuses CMSLayout but isolated logic */}
                                        <Route path="/cms/e-store/*" element={
                                            <ProtectedRoute requireAdmin>
                                                <EStoreAdminRoot />
                                            </ProtectedRoute>
                                        } />


                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Suspense>
                            </MobileLayout>
                        </div>
                    </Router>
                </SecurityLayer>
            </SnackbarProvider>
            </HelmetProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}

export default App;
