import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api.service';
import API_CONFIG from '../config/api.config';
import { useSnackbar } from '../context/SnackbarContext';
import { getUserContext } from '../services/api';
import '../styles/Exam.css';

const Exam = () => {
    const { showSnackbar } = useSnackbar();
    const { email } = getUserContext();
    const navigate = useNavigate();
    const location = useLocation();
    const fromAdmin = location.state?.fromAdmin;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [correctMap, setCorrectMap] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [examReady, setExamReady] = useState(false); // Data loaded from backend
    const [examStarted, setExamStarted] = useState(false); // User clicked 'Start'
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
    const retryTimeoutRef = React.useRef(null);
    const retryCountRef = React.useRef(0);

    const questionsPerPage = 5;

    useEffect(() => {
        setExamStarted(false);
        fetchQuestionsPage(0);
    }, []);

    // Timer Logic
    // Timer Logic - Controlled by examReady state
    // Timer Logic - Controlled by examReady state
    // Timer Logic - Controlled by examStarted state
    useEffect(() => {
        if (!examStarted) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, [examStarted]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const fetchQuestionsPage = async (page) => {
        setLoading(true);
        try {
            const response = await apiClient.get(
                API_CONFIG.ENDPOINTS.GET_QUESTIONS,
                { params: { page, size: questionsPerPage } }
            );

            const data = response.data;
            const newQuestions = data.content || [];
            const pageOffset = page * questionsPerPage;

            setQuestions(prev => {
                // Ensure array is large enough
                const total = data.totalElements || prev.length || newQuestions.length;
                const next = prev.length >= total ? [...prev] : new Array(total).fill(null);

                // Copy existing items if it was a new array
                if (prev.length > 0 && next !== prev) {
                    prev.forEach((q, idx) => { if (q) next[idx] = q; });
                }

                // Insert new questions at correct positions
                newQuestions.forEach((q, i) => {
                    next[pageOffset + i] = q;
                });
                return next;
            });

            setTotalPages(data.totalPages || 1);
            setTotalQuestions(data.totalElements || newQuestions.length);
            if (!examReady) setExamReady(true);
            setLoading(false); // Only stop loading on success
            retryCountRef.current = 0; // Reset retry count on success
        } catch (error) {
            console.error('Error fetching questions:', error);

            // Retry on Network Error OR Server Error (5xx)
            // If the exam hasn't started yet (!examReady), we should be very persistent
            const isRetryable = !error.response ||
                (error.response.status >= 500) ||
                (error.code === 'ERR_NETWORK');

            if (isRetryable && !examReady && retryCountRef.current < 5) {
                const retryCount = retryCountRef.current;
                const delay = Math.min(2000 * Math.pow(2, retryCount), 30000); // Exponential backoff capped at 30s
                console.log(`Fetch failed, retrying in ${delay}ms... (Attempt ${retryCount + 1}/5)`);

                // Clear any existing timeout to be safe
                if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = setTimeout(() => fetchQuestionsPage(page), delay);
                retryCountRef.current = retryCount + 1;
            } else {
                if (retryCountRef.current >= 5) {
                    showSnackbar('Unable to connect to server. Please try again.', 'error');
                } else if (error.response?.status === 401 || error.response?.status === 403) {
                    showSnackbar('Session expired. Please login again.', 'error');
                } else {
                    showSnackbar('Error loading questions. Please refresh.', 'error');
                }
                setLoading(false);
            }
        }
    };

    const handleOptionChange = (questionId, selectedOpt, isMulti) => {
        setAnswers(prev => {
            const current = prev[questionId] || "";
            if (!isMulti) return { ...prev, [questionId]: selectedOpt };

            let next = current.includes(selectedOpt)
                ? current.replace(selectedOpt, "")
                : current + selectedOpt;

            next = next.split('').sort().join('');
            return { ...prev, [questionId]: next };
        });
    };

    const jumpToSection = (pageIndex) => {
        setCurrentPage(pageIndex);
        const startIndex = pageIndex * questionsPerPage;
        // Check if the specific page data is missing
        if (!questions[startIndex]) {
            fetchQuestionsPage(pageIndex);
        }
    };

    const handleNext = () => {
        if (currentPage + 1 < totalPages) {
            jumpToSection(currentPage + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // 1. Ensure we have ALL questions for the final review
            let finalQuestions = questions;
            // Check if we have missing questions (length mismatch OR sparse/null entries triggered by skipping pages)
            if (questions.length < totalQuestions || questions.some(q => !q)) {
                const responseFull = await apiClient.get(
                    API_CONFIG.ENDPOINTS.GET_QUESTIONS,
                    { params: { page: 0, size: totalQuestions } }
                );
                finalQuestions = responseFull.data.content || [];
                setQuestions(finalQuestions);
            }

            // 2. Submit the exam - USE finalQuestions (not questions state) to avoid closure lag
            const answerList = finalQuestions.map(q => ({
                questionId: q.id,
                selectedOpt: answers[q.id] || ""
            }));

            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_EXAM, answerList);

            // 3. Robust Score Parsing
            let parsedScore = 0;
            const resData = response.data;

            if (resData && typeof resData === 'object' && resData.score !== undefined) {
                parsedScore = Number(resData.score);
                const map = {};
                resData.correctOptions?.forEach(item => {
                    map[item.questionId] = item.correctOption;
                });
                setCorrectMap(map);
            } else if (typeof resData === 'string') {
                // Handle formats: "your Score is :5", "Score: 5", "Total: 5/15", "5"
                const match = resData.match(/[:\s](\d+)/) || resData.match(/^(\d+)$/);
                parsedScore = match ? parseInt(match[1]) : 0;

                // Fallback: If no colon match, try searching for any number in the string
                if (!match) {
                    const fallbackMatch = resData.match(/\d+/);
                    if (fallbackMatch) parsedScore = parseInt(fallbackMatch[0]);
                }
            } else if (typeof resData === 'number') {
                parsedScore = resData;
            }

            setScore(parsedScore);
            showSnackbar('Exam submitted successfully!', 'success');
        } catch (error) {
            handleApiError(error, 'Failed to submit exam.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApiError = (error, defaultMsg) => {
        const msg = error.response?.data?.message || defaultMsg;
        showSnackbar(msg, 'error');
    };

    if (loading && questions.length === 0) {
        return (
            <div className="exam-portal-wrapper">
                <div className="exam-stage" style={{ justifyContent: 'center' }}>
                    <div className="loader-icon" style={{ fontSize: '3rem', color: 'var(--portal-primary)', marginBottom: '1rem' }}>
                        <i className="fas fa-circle-notch fa-spin"></i>
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--portal-dark)' }}>Loading Secure Portal...</p>
                </div>
            </div>
        );
    }

    // ---------------- RESULT VIEW: SIMPLIFIED AUDIT PORTAL ----------------
    if (score !== null) {
        // Calculate client-side score as insurance/audit
        let auditScore = 0;
        questions.forEach(q => {
            const qKey = (q.correctOption || q.correctAnswer || "").toUpperCase().split('').sort().join('');
            const sKey = (answers[q.id] || "").toUpperCase().split('').sort().join('');
            if (sKey !== "" && sKey === qKey) auditScore++;
        });

        const finalDisplayScore = Math.max(Number(score) || 0, auditScore);
        const skippedCount = totalQuestions - Object.keys(answers).length;
        const attempted = totalQuestions - skippedCount;
        const accuracy = attempted > 0 ? Math.round((finalDisplayScore / attempted) * 100) : 0;

        return (
            <div className="exam-portal-wrapper">
                <header className="exam-portal-header">
                    <div className="portal-brand">
                        <div className="logo-icon"><i className="fas fa-clipboard-check"></i></div>
                        <span>Assessment Results</span>
                    </div>
                    <div className="portal-user">
                        <span>{email}</span>
                        <button className="exit-btn" onClick={() => {
                            if (fromAdmin) {
                                navigate('/dashboard', { replace: true });
                            } else {
                                window.location.href = '/';
                            }
                        }}>Close Portal</button>
                    </div>
                </header>

                <div className="exam-portal-main">
                    <aside className="exam-navigator-sidebar">
                        <div className="navigator-title">Navigator</div>
                        <div className="question-grid">
                            {questions.map((q, i) => {
                                const qKey = (q.correctOption || q.correctAnswer || "").toUpperCase().split('').sort().join('');
                                const sKey = (answers[q.id] || "").toUpperCase().split('').sort().join('');
                                const isCorrect = sKey !== "" && sKey === qKey;
                                const isSkipped = sKey === "";

                                return (
                                    <div
                                        key={i}
                                        className={`q-nav-item ${isCorrect ? 'audit-correct' : isSkipped ? 'audit-skipped' : 'audit-wrong'}`}
                                        onClick={() => {
                                            const el = document.getElementById(`audit-case-${q.id}`);
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    <main className="exam-stage">
                        <div className="stage-card audit-portal-card">
                            <div style={{ textAlign: 'center', padding: '3rem 0', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>Final Examination Score</div>
                                <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--portal-dark)' }}>
                                    {finalDisplayScore} <span style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 400 }}>/ {totalQuestions}</span>
                                </div>
                                <p style={{ color: '#64748b', marginTop: '1rem' }}>Overall Accuracy: {accuracy}%</p>
                            </div>

                            <div className="exec-stats-row" style={{ margin: '2rem 0', gap: '1rem' }}>
                                <div className="exec-stat-card" style={{ flex: 1 }}>
                                    <span className="exec-stat-val">{attempted}</span>
                                    <span className="exec-stat-lbl">Attempted</span>
                                </div>
                                <div className="exec-stat-card" style={{ flex: 1 }}>
                                    <span className="exec-stat-val">{skippedCount}</span>
                                    <span className="exec-stat-lbl">Skipped</span>
                                </div>
                            </div>

                            <div className="exec-section-title" style={{ marginTop: '3rem' }}>
                                <i className="fas fa-microscope"></i> Detailed Audit Log
                            </div>

                            <div className="master-solution-list" style={{ marginTop: '2rem' }}>
                                {questions.map((question, index) => {
                                    const officialKey = question.correctOption || question.correctAnswer || "";
                                    const correctStr = officialKey.toUpperCase().split('').sort().join('');
                                    const studentStr = (answers[question.id] || "").toUpperCase().split('').sort().join('');

                                    const isCorrect = studentStr !== "" && studentStr === correctStr;
                                    const isSkipped = studentStr === "";

                                    const getFormattedText = (str) => {
                                        if (!str || str === "") return "No response recorded";
                                        return str.split('').map(char => {
                                            const charCode = char.charCodeAt(0);
                                            if (charCode >= 65 && charCode <= 68) {
                                                const idx = charCode - 65;
                                                return `${char}: ${question[`option${idx + 1}`]}`;
                                            }
                                            return char;
                                        }).join(' | ');
                                    };

                                    return (
                                        <div key={question.id} id={`audit-case-${question.id}`} className="master-q-card">
                                            <span className="master-q-index">AUDIT CASE #{index + 1}</span>
                                            <h4 className="master-q-text" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>{question.question}</h4>

                                            <div className="solution-inspector">
                                                <div className="inspector-panel">
                                                    <span className="panel-label">User Selection</span>
                                                    <div className={`panel-content user-pick ${isCorrect ? 'correct' : isSkipped ? 'skipped' : 'wrong'}`}>
                                                        {isCorrect ? <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> :
                                                            isSkipped ? <i className="fas fa-minus-circle" style={{ color: '#f59e0b' }}></i> :
                                                                <i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i>}
                                                        <span>{getFormattedText(studentStr)}</span>
                                                    </div>
                                                </div>

                                                <div className="inspector-panel">
                                                    <span className="panel-label">Verified Solution</span>
                                                    <div className="panel-content official-key">
                                                        <i className="fas fa-shield-halved" style={{ color: 'var(--portal-primary)' }}></i>
                                                        <span>{getFormattedText(officialKey)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="options-strip">
                                                {['option1', 'option2', 'option3', 'option4'].map((opt, i) => {
                                                    const letter = String.fromCharCode(65 + i);
                                                    const isC = officialKey.toUpperCase().includes(letter);
                                                    const isS = studentStr.includes(letter);
                                                    let cls = "strip-pill";
                                                    if (isC) cls += " hit";
                                                    else if (isS) cls += " miss";

                                                    return (
                                                        <div key={opt} className={cls}>
                                                            {letter}. {question[opt]}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="exec-actions" style={{ marginTop: '4rem' }}>
                                <button className="btn-exec-primary" onClick={() => window.location.href = '/'}>
                                    Finalize Analytics & Exit Portal
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // ---------------- START SCREEN (INTERSTITIAL) ----------------
    if (!examStarted) {
        return (
            <div className="exam-portal-wrapper">
                <header className="exam-portal-header">
                    <div className="portal-brand">
                        <div className="logo-icon"><i className="fas fa-graduation-cap"></i></div>
                        <span>Exam Instructions</span>
                    </div>
                </header>

                <div className="exam-stage" style={{ justifyContent: 'center' }}>
                    <div className="stage-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', background: 'var(--portal-bg)',
                            borderRadius: '50%', margin: '0 auto 2rem', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                            color: 'var(--portal-dark)'
                        }}>
                            <i className="fas fa-file-contract"></i>
                        </div>

                        <h2 style={{ fontSize: '2rem', color: 'var(--portal-dark)', marginBottom: '1rem', fontWeight: 800 }}>Ready to Begin?</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: '1.6' }}>
                            You are about to start the assessment. The timer will begin as soon as you click Start.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--portal-dark)', marginBottom: '0.5rem' }}>{totalQuestions}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Questions</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--portal-dark)', marginBottom: '0.5rem' }}>30</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Minutes</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn-hero-secondary"
                                onClick={() => window.location.href = '/'}
                            >
                                Go Back
                            </button>
                            <button
                                className="btn-hero-primary"
                                onClick={() => setExamStarted(true)}
                            >
                                Start Exam <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------- QUESTION VIEW ----------------
    const startIndex = currentPage * questionsPerPage;
    const currentQuestions = questions.slice(startIndex, startIndex + questionsPerPage);
    const progress = Math.round((Object.keys(answers).length / totalQuestions) * 100);

    return (
        <div className="exam-portal-wrapper">
            <header className="exam-portal-header">
                <div className="portal-brand">
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                    <div className="logo-icon">
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <span>CAREER VEDHA</span>
                </div>
                <div className="portal-timer">
                    <i className="far fa-clock"></i>
                    <span>{formatTime(timeLeft)}</span>
                </div>
                <div className="portal-user">
                    <span className="user-email-display">{email}</span>
                    <button className="exit-btn" onClick={() => {
                        if (fromAdmin) {
                            navigate('/dashboard', { replace: true });
                        } else {
                            window.location.href = '/';
                        }
                    }}>Exit Exam</button>
                </div>
            </header>

            <div className="exam-portal-main">
                {/* Backdrop Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
                )}

                <aside className={`exam-navigator-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
                    <div className="navigator-title">
                        Question Navigator
                    </div>
                    <div className="question-grid">
                        {[...Array(totalQuestions)].map((_, i) => {
                            const qId = questions[i]?.id;
                            const isAnswered = qId && answers[qId];
                            const isCurrent = i >= startIndex && i < startIndex + questionsPerPage;
                            const sectionIndex = Math.floor(i / questionsPerPage);

                            return (
                                <div
                                    key={i}
                                    className={`q-nav-item ${isCurrent ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                                    onClick={() => jumpToSection(sectionIndex)}
                                >
                                    {i + 1}
                                </div>
                            );
                        })}
                    </div>
                    <div className="navigator-legend" style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: 12, height: 12, background: 'var(--portal-primary)', borderRadius: '3px' }}></div> Answered
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 12, height: 12, background: 'var(--portal-dark)', borderRadius: '3px' }}></div> Current Section
                        </div>
                    </div>
                </aside>

                <main className="exam-stage">
                    <div className="stage-card">
                        <div className="stage-progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>

                        {(!currentQuestions[0]) ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                {loading ? (
                                    <>
                                        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--portal-primary)', marginBottom: '1rem' }}></i>
                                        <p>Loading questions for this section...</p>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '1rem' }}></i>
                                        <p style={{ marginBottom: '1rem', color: '#64748b' }}>Unable to load questions.</p>
                                        <button
                                            className="btn-retry-action"
                                            onClick={() => {
                                                retryCountRef.current = 0; // Reset count
                                                fetchQuestionsPage(currentPage);
                                            }}
                                        >
                                            <i className="fas fa-sync-alt"></i> Retry Connection
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            currentQuestions.map((question, idx) => {
                                if (!question) return null;
                                const officialKey = question.correctOption || question.correctAnswer || "";
                                const isMulti = officialKey.length > 1;
                                const currentAnswer = answers[question.id] || "";

                                return (
                                    <div key={question.id} className="premium-q-card">
                                        <h3>{startIndex + idx + 1}. {question.question}</h3>
                                        <span className="type-hint-badge">{isMulti ? "Multiple Choice" : "Single Choice"}</span>

                                        <div className="premium-options">
                                            {['option1', 'option2', 'option3', 'option4'].map((opt, i) => {
                                                const letter = String.fromCharCode(65 + i);
                                                const isSelected = currentAnswer.includes(letter);
                                                return (
                                                    <label key={opt} className={`premium-opt-label ${isSelected ? 'selected' : ''}`}>
                                                        <input
                                                            type={isMulti ? "checkbox" : "radio"}
                                                            name={`q-${question.id}`}
                                                            checked={isSelected}
                                                            onChange={() => handleOptionChange(question.id, letter, isMulti)}
                                                        />
                                                        <div className="opt-letter">{letter}</div>
                                                        <span>{question[opt]}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {currentQuestions.length > 0 && (
                            <div className="navigation" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
                                {currentPage > 0 && (
                                    <button className="btn-nav-secondary" onClick={handlePrevious}>Previous Section</button>
                                )}

                                {currentPage === totalPages - 1 ? (
                                    <button
                                        className="btn-nav-primary"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Finalize & Submit'}
                                    </button>
                                ) : (
                                    <button
                                        className="btn-nav-primary"
                                        onClick={handleNext}
                                        disabled={loading}
                                    >
                                        Next Section <i className="fas fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Exam;
