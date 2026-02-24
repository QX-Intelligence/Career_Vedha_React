import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../services/api.service';
import API_CONFIG from '../../../config/api.config';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getUserContext } from '../../../services/api';
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
    const CUSTOM_QUESTION_COUNT = 10;

    // New State for Custom Exam & Creation
    const [examMode, setExamMode] = useState('standard'); // 'standard' | 'custom'
    const [customConfig, setCustomConfig] = useState({ type: 'category', value: '', label: '' }); // type: 'chapter' | 'category'
    const [hierarchy, setHierarchy] = useState([]);
    const [selectedLevelId, setSelectedLevelId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [questionsToCreate, setQuestionsToCreate] = useState([{
        question: '', option1: '', option2: '', option3: '', option4: '',
        correctAnswer: '', chapterId: '', category: ''
    }]);
    const [creationError, setCreationError] = useState(null);
    const [noQuestions, setNoQuestions] = useState(false);

    useEffect(() => {
        setExamStarted(false);
        fetchAcademicsHierarchy();
    }, []);

    // Trigger initial fetch for standard mode when user clicks 'Start'
    useEffect(() => {
        if (examStarted && examMode === 'standard' && questions.length === 0) {
            fetchQuestionsPage(0);
        }
    }, [examStarted, examMode]);

    const fetchAcademicsHierarchy = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(API_CONFIG.ENDPOINTS.ACADEMICS_HIERARCHY);
            const data = res.data || res;
            setHierarchy(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch hierarchy:', err);
            showSnackbar('Failed to load academic structure', 'error');
        } finally {
            setLoading(false);
        }
    };

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
        // Since get-all-questions doesn't exist, we fallback to random fetching if state is empty
        if (questions.length > 0 && questions[page * questionsPerPage]) {
            return; // Already have data for this page
        }

        setLoading(true);
        try {
            // We use the 'custom' fetch logic even for 'standard' if we have no questions, 
            // but we fetch a larger batch (e.g. 50) to simulate a standard assessment.
            
            const categoryToUse = customConfig.value;
            
            if (!categoryToUse) {
                setLoading(false);
                return;
            }

            const response = await apiClient.get(
                API_CONFIG.ENDPOINTS.GET_RANDOM_QUESTIONS_BY_CATEGORY,
                { params: { category: categoryToUse, count: 50 } }
            );

            const data = response.data || [];
            
            setQuestions(data);
            setTotalQuestions(data.length);
            setTotalPages(Math.ceil(data.length / questionsPerPage));
            
            if (!examReady) setExamReady(true);
            setLoading(false);
            retryCountRef.current = 0;
        } catch (error) {
            console.error('Error fetching questions:', error);
            handleApiError(error, 'Error loading questions. Ensure categories are available.');
            setLoading(false);
        }
    };

    // Auto-start validation effect
    useEffect(() => {
        // Redirection logic: If no config is passed in state, go back to the explorer
        if (!location.state?.examConfig && !location.state?.fromAdmin) {
            navigate('/academic-exams', { replace: true });
            return;
        }

        if (location.state?.examConfig) {
            const config = location.state.examConfig;
            setCustomConfig(config);
            
            // Pre-populate selections if provided in state
            if (location.state.level) setSelectedLevelId(location.state.level.id.toString());
            if (location.state.subject) setSelectedSubjectId(location.state.subject.id.toString());

            startCustomExam(config);
        }
    }, [location.state, navigate]);

    const startCustomExam = async (directConfig = null) => {
        const config = directConfig || customConfig;
        
        if (config.type === 'chapter') {
             if (!config.value || isNaN(Number(config.value)) || Number(config.value) <= 0) {
                 showSnackbar("Please enter a valid Chapter ID", 'error');
                 return;
             }
        } else if (!config.value) {
            showSnackbar("Please select a Category", 'error');
            return;
        }

        setLoading(true);
        setExamMode('custom');
        setQuestions([]); // Clear any preloaded standard questions

        try {
            const params = config.type === 'chapter'
                ? { chapterId: Number(config.value), count: CUSTOM_QUESTION_COUNT }
                : { category: config.value, count: CUSTOM_QUESTION_COUNT };

            const url = config.type === 'chapter'
                ? API_CONFIG.ENDPOINTS.GET_RANDOM_QUESTIONS_BY_CHAPTER
                : API_CONFIG.ENDPOINTS.GET_RANDOM_QUESTIONS_BY_CATEGORY;

            const res = await apiClient.get(url, { params });
            const data = res.data || res;

            if (!data || !Array.isArray(data) || data.length === 0) {
                setNoQuestions(true);
                setLoading(false);
                return;
            }

            setQuestions(data);
            setTotalQuestions(data.length);
            setTotalPages(Math.ceil(data.length / questionsPerPage));
            setExamReady(true);
            setExamStarted(true);
            setCurrentPage(0);
            setTimeLeft(data.length * 60); // 1 min per question
            setLoading(false);
        } catch (err) {
            handleApiError(err, 'Failed to start custom exam');
            setExamMode('standard');
            setLoading(false);
        }
    };

    /* ===== CREATE QUESTION LOGIC ===== */
    const addQuestionField = () => {
        setQuestionsToCreate([...questionsToCreate, {
            question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', chapterId: '', category: ''
        }]);
    };

    const removeQuestionField = (index) => {
        setQuestionsToCreate(questionsToCreate.filter((_, i) => i !== index));
    };

    const updateQuestionField = (index, field, value) => {
        const updated = [...questionsToCreate];
        updated[index][field] = value;
        setQuestionsToCreate(updated);
    };

    const submitCreatedQuestions = async () => {
        setLoading(true);
        try {
            // Validation
            for (let i = 0; i < questionsToCreate.length; i++) {
                const q = questionsToCreate[i];
                if (!q.question.trim() || !q.option1.trim() || !q.correctAnswer.trim()) {
                    showSnackbar(`Question ${i + 1}: Missing required fields`, 'error');
                    setLoading(false);
                    return;
                }
            }

            const payload = questionsToCreate.map(q => ({
                question: q.question.trim(),
                option1: q.option1.trim(),
                option2: q.option2.trim(),
                option3: q.option3.trim(),
                option4: q.option4.trim(),
                correctAnswer: q.correctAnswer.trim(),
                ...(q.chapterId && { chapterId: Number(q.chapterId) }),
                ...(q.category && { category: q.category.trim() })
            }));

            await apiClient.post(API_CONFIG.ENDPOINTS.CREATE_QUESTION, payload);
            showSnackbar(`${questionsToCreate.length} questions created!`, 'success');
            setShowCreateForm(false);
            setQuestionsToCreate([{ question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', chapterId: '', category: '' }]);
        } catch (err) {
            handleApiError(err, 'Failed to create questions');
        } finally {
            setLoading(false);
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
            // Since we now fetch all questions at once (50 for standard, CUSTOM_QUESTION_COUNT for custom),
            // we don't need to re-fetch from the non-existent GET_QUESTIONS endpoint.

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
            
            // Map correct options for audit portal
            if (resData?.correctOptions) {
                const map = {};
                resData.correctOptions.forEach(item => {
                    map[item.questionId] = item.correctOption;
                });
                setCorrectMap(map);
            }

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
        const finalDisplayScore = Number(score) || 0;
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
                        <button className="exit-btn" onClick={() => navigate(-1)}>Close Portal</button>
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
                                    const officialKey = correctMap[question.id] || question.correctOption || question.correctAnswer || "";
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
                                                const optText = question[`option${idx + 1}`] || question[`opt${idx + 1}`];
                                                return `${char}: ${optText || 'N/A'}`;
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

                                                    const optText = question[opt] || question[`opt${i + 1}`];

                                                    return (
                                                        <div key={opt} className={cls}>
                                                            {letter}. {optText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="exec-actions" style={{ marginTop: '4rem' }}>
                                <button className="btn-exec-primary" onClick={() => navigate(-1)}>
                                    Finalize Analytics & Exit Portal
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // ---------------- QUESTIONS ADDING SOON SCREEN ----------------
    if (noQuestions) {
        return (
            <div className="exam-portal-wrapper empty-state-wrapper">
                <div className="mesh-gradient-bg"></div>
                
                <header className="exam-portal-header glass-header">
                    <div className="portal-brand">
                        <div className="logo-icon"><i className="fas fa-graduation-cap"></i></div>
                        <span>Exam Portal</span>
                    </div>
                    <div className="portal-user">
                        <button className="exit-btn" onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i> Go Back
                        </button>
                    </div>
                </header>

                <div className="exam-stage empty-state-creative-stage">
                    <div className="creative-empty-card">
                        <div className="visual-scene">
                            <div className="floating-elements">
                                <i className="fas fa-book float-1"></i>
                                <i className="fas fa-pen-fancy float-2"></i>
                                <i className="fas fa-lightbulb float-3"></i>
                            </div>
                            <div className="main-construction-icon">
                                <div className="icon-circle-outer"></div>
                                <div className="icon-circle-inner">
                                    <i className="fas fa-tools construction-tool"></i>
                                    <i className="fas fa-hourglass-half main-hourglass"></i>
                                </div>
                            </div>
                        </div>

                        <div className="content-box">
                            <span className="badge-coming-soon">Content in Progress</span>
                            <h2>Building Your Question Bank</h2>
                            <p>
                                Our educators are currently hand-picking the best practice questions for 
                                <strong> {customConfig.label || "this topic"}</strong>. 
                                We'll have it ready for you in no time!
                            </p>
                            
                            <div className="actions-row">
                                <button className="btn-creative-primary" onClick={() => navigate(-1)}>
                                    <i className="fas fa-compass"></i> Explore Other Subjects
                                </button>
                                <button className="btn-creative-outline" onClick={() => window.location.reload()}>
                                    <i className="fas fa-sync-alt"></i> Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------- START SCREEN (INTERSTITIAL / PREPARING) ----------------
    if (!examStarted) {
        return (
            <div className="exam-portal-wrapper">
                <header className="exam-portal-header">
                    <div className="portal-brand">
                        <div className="logo-icon"><i className="fas fa-graduation-cap"></i></div>
                        <span>Exam Portal</span>
                    </div>
                </header>

                <div className="exam-stage" style={{ justifyContent: 'center', overflowY: 'auto' }}>
                    
                    {/* TOGGLE CREATE FORM (Hidden by default, or for admins) */}
                    <div style={{ position: 'absolute', top: 20, right: 20 }}>
                        <button 
                            className="btn-text" 
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{ color: '#64748b', fontSize: '0.9rem' }}
                        >
                            {showCreateForm ? 'Close Question Form' : 'Create Questions (Admin)'}
                        </button>
                    </div>

                    {showCreateForm ? (
                        <div className="stage-card" style={{ maxWidth: '800px', width: '100%' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--portal-dark)' }}>Create New Questions</h3>
                            {questionsToCreate.map((q, idx) => (
                                <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong>Question {idx + 1}</strong>
                                        {questionsToCreate.length > 1 && (
                                            <button onClick={() => removeQuestionField(idx)} style={{ color: '#ef4444', background: 'none', border: 'none' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Question Text"
                                        className="form-control"
                                        value={q.question} 
                                        onChange={e => updateQuestionField(idx, 'question', e.target.value)}
                                        style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {['option1', 'option2', 'option3', 'option4'].map((opt, oIdx) => (
                                            <input 
                                                key={opt}
                                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                value={q[opt]}
                                                onChange={e => updateQuestionField(idx, opt, e.target.value)}
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                        <select 
                                            value={q.correctAnswer} 
                                            onChange={e => updateQuestionField(idx, 'correctAnswer', e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">Correct Answer</option>
                                            <option value="A">Option A</option>
                                            <option value="B">Option B</option>
                                            <option value="C">Option C</option>
                                            <option value="D">Option D</option>
                                        </select>
                                        <input 
                                            placeholder="Chapter ID (Optional)"
                                            type="number"
                                            value={q.chapterId}
                                            onChange={e => updateQuestionField(idx, 'chapterId', e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        />
                                        <input 
                                            placeholder="Category (Optional)"
                                            value={q.category}
                                            onChange={e => updateQuestionField(idx, 'category', e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn-hero-secondary" onClick={addQuestionField}>+ Add Another</button>
                                <button className="btn-hero-primary" onClick={submitCreatedQuestions} disabled={loading}>
                                    {loading ? 'Creating...' : 'Submit Questions'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="stage-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                            <div className="loader-icon" style={{ fontSize: '3rem', color: 'var(--portal-primary)', marginBottom: '1rem' }}>
                                <i className="fas fa-circle-notch fa-spin"></i>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', color: 'var(--portal-dark)', marginBottom: '0.5rem', fontWeight: 800 }}>
                                Preparing Your Assessment
                            </h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                                Please wait while we secure your exam session and load the questions for <strong>{customConfig.label || "your selected topic"}</strong>.
                            </p>
                        </div>
                    )}
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
                    <button className="exit-btn" onClick={() => navigate(-1)}>Exit Exam</button>
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
                                                    const optText = question[opt] || question[`opt${i + 1}`];
                                                    
                                                    return (
                                                        <label key={opt} className={`premium-opt-label ${isSelected ? 'selected' : ''}`}>
                                                            <input
                                                                type={isMulti ? "checkbox" : "radio"}
                                                                name={`q-${question.id}`}
                                                                checked={isSelected}
                                                                onChange={() => handleOptionChange(question.id, letter, isMulti)}
                                                            />
                                                            <div className="opt-letter">{letter}</div>
                                                            <span>{optText || 'N/A'}</span>
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
