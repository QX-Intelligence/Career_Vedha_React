import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAcademicsHierarchy } from '../../hooks/useAcademics';
import { academicsService } from '../../services/academicsService';
import Skeleton from '../ui/Skeleton';
import ChapterMaterialsView from '../academics/ChapterMaterialsView';
import './StudentAcademicsExplorer.css';

const StudentAcademicsExplorer = ({ showHeader = true, className = '', style = {}, activeLevelId = null, activeLanguage: propLanguage = null }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: hierarchy, isLoading } = useAcademicsHierarchy();

    // Track last loaded language to trigger re-fetch on change
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return propLanguage || localStorage.getItem('preferredLanguage') || 'english';
    });
    const lastLoadedLangRef = React.useRef(activeLanguage);

    // Navigation State (Derived from URL/Hierarchy)
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [chapterMaterials, setChapterMaterials] = useState(null);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [subjectBlocksCache, setSubjectBlocksCache] = useState({}); // { subjectId: blocks }

    // Sync prop language to state
    useEffect(() => {
        if (propLanguage && propLanguage !== activeLanguage) {
            setActiveLanguage(propLanguage);
        }
    }, [propLanguage]);

    // Effect to sync URL -> Local State
    useEffect(() => {
        if (!hierarchy) return;

        const levelId = activeLevelId || searchParams.get('level');
        const subjectId = searchParams.get('subject');
        const chapterId = searchParams.get('chapter');

        // Resolve Level & Subject first
        let currentSubject = null;
        if (levelId) {
            const level = hierarchy.find(l => l.id.toString() === levelId.toString());
            if (level) {
                setSelectedLevel(level);
                if (subjectId) {
                    currentSubject = level.subjects?.find(s => s.id.toString() === subjectId.toString());
                    setSelectedSubject(currentSubject || null);
                } else {
                    setSelectedSubject(null);
                }
            } else {
                setSelectedLevel(null);
                setSelectedSubject(null);
            }
        } else {
            setSelectedLevel(null);
            setSelectedSubject(null);
        }

        // Sync Chapter Selection
        if (currentSubject && chapterId) {
            const chapter = currentSubject.chapters?.find(c => c.id.toString() === chapterId);
            if (chapter) {
                const langChanged = lastLoadedLangRef.current !== activeLanguage;
                // If chapter changed OR language changed OR materials not loaded, load them
                if (!selectedChapter || selectedChapter.id.toString() !== chapterId || langChanged) {
                    loadChapterData(chapter, currentSubject);
                }
            } else {
                setSelectedChapter(null);
                setChapterMaterials(null);
            }
        } else {
            setSelectedChapter(null);
            setChapterMaterials(null);
        }
    }, [searchParams, hierarchy, activeLevelId, activeLanguage]);

    // Helpers to update URL
    const updateNavigation = (levelId, subjectId, chapterId = null) => {
        const newParams = new URLSearchParams(searchParams);
        if (levelId) newParams.set('level', levelId); else newParams.delete('level');
        if (subjectId) newParams.set('subject', subjectId); else newParams.delete('subject');
        if (chapterId) newParams.set('chapter', chapterId); else newParams.delete('chapter');
        setSearchParams(newParams);
    };

    // Helpers
    const handleStartExam = (config) => {
        navigate('/exam', { state: { examConfig: config } });
    };

    const resetSelection = () => {
        setSelectedChapter(null);
        setChapterMaterials(null);
        updateNavigation(null, null);
    };

    const goToSubjects = () => {
        const levelId = activeLevelId || searchParams.get('level');
        setSelectedChapter(null);
        setChapterMaterials(null);
        updateNavigation(levelId, null);
    };

    const loadChapterData = async (chapter, subject) => {
        setSelectedChapter(chapter);
        setLoadingMaterials(true);
        
        try {
            const lang = activeLanguage === 'telugu' ? 'te' : 'en';
            lastLoadedLangRef.current = activeLanguage; // Mark this language as loaded
            const cacheKey = `${subject.id}_${lang}`;
            
            let blocks = subjectBlocksCache[cacheKey];
            
            if (!blocks) {
                const response = await academicsService.getSubjectBlocks(subject.id, lang);
                blocks = response;
                setSubjectBlocksCache(prev => ({ ...prev, [cacheKey]: blocks }));
            }
            
            const chapterBlock = blocks.find(b => b.chapter.id === parseInt(chapter.id));
            setChapterMaterials(chapterBlock || { chapter: { id: chapter.id }, materials: [] });
            
        } catch (error) {
            console.error('Error loading chapter materials:', error);
            setChapterMaterials({ chapter, materials: [], error: true });
        } finally {
            setLoadingMaterials(false);
        }
    };

    const handleChapterClick = (chapter) => {
        updateNavigation(
            activeLevelId || searchParams.get('level'), 
            selectedSubject?.id, 
            chapter.id
        );
    };

    const goToChapterExam = () => {
        navigate('/exam', {
            state: {
                examConfig: {
                    type: 'chapter',
                    value: selectedChapter.id.toString(),
                    label: selectedChapter.name
                },
                level: selectedLevel,
                subject: selectedSubject,
                autoStart: true
            }
        });
    };

    if (isLoading) {
        return (
            <div className="academics-explorer-section">
                <div className="container">
                    <Skeleton height="300px" />
                </div>
            </div>
        );
    }

    if (!hierarchy || hierarchy.length === 0) return null;

    // --- RENDERERS ---

    // 1. Level View (Root)
    const renderLevels = () => (
        <div className="explorer-grid animated-grid">
            {hierarchy.map(level => {
                const hasSubjects = level.subjects && level.subjects.length > 0;
                // Logic: If no subjects, this level is a leaf node -> Offer Exam directly (mapped to Category)
                
                return (
                    <div 
                        key={level.id} 
                        className="explorer-card"
                        onClick={() => hasSubjects && setSelectedLevel(level)}
                    >
                        <div>
                            <div className="card-icon">
                                <i className="fas fa-layer-group"></i>
                            </div>
                            <h3 className="card-title">{level.name}</h3>
                            <div className="card-meta">
                                <i className="fas fa-book"></i> {level.subjects?.length || 0} Subjects
                            </div>
                        </div>
                        
                        <div className="card-actions">
                            {hasSubjects ? (
                                <button className="btn-explore-view" onClick={(e) => {
                                    e.stopPropagation();
                                    updateNavigation(level.id, null);
                                }}>
                                    Explore Subjects
                                </button>
                            ) : (
                                <button className="btn-explore-exam" onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartExam({ type: 'category', value: level.name, label: level.name });
                                }}>
                                    <i className="fas fa-play-circle"></i> Try Exam
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // 2. Subject View (Children of Level)
    const renderSubjects = () => (
        <div className="explorer-grid animated-grid">
            {selectedLevel.subjects.map(subject => {
                const hasChapters = subject.chapters && subject.chapters.length > 0;
                // Logic: If no chapters, offers Subject Exam (Category based)
                
                return (
                    <div 
                        key={subject.id} 
                        className="explorer-card"
                        onClick={() => hasChapters && setSelectedSubject(subject)}
                    >
                        <div>
                            <div className="card-icon">
                                <i className="fas fa-book-open"></i>
                            </div>
                            <h3 className="card-title">{subject.name}</h3>
                            <div className="card-meta">
                                <i className="fas fa-book"></i> {subject.chapters?.length || 0} Chapters
                            </div>
                        </div>

                        <div className="card-actions">
                            {hasChapters ? (
                                <button className="btn-explore-view" onClick={(e) => {
                                    e.stopPropagation();
                                    updateNavigation(activeLevelId || searchParams.get('level'), subject.id);
                                }}>
                                    Explore Chapters <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>
                                </button>
                            ) : (
                                <button className="btn-explore-exam" onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartExam({ type: 'category', value: subject.name, label: subject.name });
                                }}>
                                    <i className="fas fa-play-circle"></i> Try Exam
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // 3. Chapter View (Children of Subject) -> This is "Materials" level
    const renderChapters = () => (
        <div className="explorer-grid chapter-grid">
             {selectedSubject.chapters.map(chapter => (
                <div 
                    key={chapter.id} 
                    className="explorer-card premium-chapter-card"
                    onClick={() => handleChapterClick(chapter)}
                >
                    <div className="card-glass-effect"></div>
                    <div className="card-top-accent"></div>
                    
                    <div className="chapter-card-main">
                        <div className="chapter-icon-wrapper">
                            <div className="chapter-icon-box">
                                <i className="fas fa-book-reader"></i>
                            </div>
                            <div className="chapter-icon-secondary">
                                <i className="fas fa-star"></i>
                            </div>
                        </div>
                        
                        <div className="chapter-info">
                            <h3 className="chapter-title">{chapter.name}</h3>
                            <p className="chapter-desc">
                                {chapter.description || "Master this chapter with our detailed mock exams and practice questions."}
                            </p>
                        </div>
                    </div>

                     <div className="chapter-card-footer">
                         <button 
                            className="btn-chapter-action" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChapterClick(chapter);
                            }}
                            disabled={loadingMaterials && selectedChapter?.id === chapter.id}
                        >
                             <span>
                                 {loadingMaterials && selectedChapter?.id === chapter.id ? "Loading Content..." : "View Materials"}
                             </span>
                             <i className={loadingMaterials && selectedChapter?.id === chapter.id ? "fas fa-spinner fa-spin" : "fas fa-arrow-right"}></i>
                         </button>
                    </div>
                </div>
             ))}
        </div>
    );

    // Determines title based on current view
    const getHeading = () => {
        if (!selectedLevel) return "Academic Hierarchy";
        if (!selectedSubject) return selectedLevel.name;
        return selectedSubject.name; // Viewing chapters of this subject
    };

    return (
        <section id="student-academics-explorer" className={`academics-explorer-section ${className}`} style={style}>
            <div className="container explorer-container">
                
                {showHeader && (
                    <div className="explorer-header">
                        <h2>Explore Academics & Exams</h2>
                        <p>Navigate through our structured curriculum and take assessments at any level to test your knowledge.</p>
                    </div>
                )}

                {/* Breadcrumbs */}
                {(selectedLevel || selectedSubject) && (
                    <div className="explorer-breadcrumbs">
                        <button className="crumb-btn" onClick={resetSelection}>
                            Home
                        </button>
                        
                        {selectedLevel && (
                             <>
                                <span className="crumb-separator"><i className="fas fa-chevron-right"></i></span>
                                <button 
                                    className={`crumb-btn ${!selectedSubject ? 'crumb-current' : ''}`} 
                                    onClick={goToSubjects}
                                >
                                    {selectedLevel.name}
                                </button>
                             </>
                        )}

                        {selectedSubject && (
                             <>
                                <span className="crumb-separator"><i className="fas fa-chevron-right"></i></span>
                                <button 
                                    className={`crumb-btn ${!selectedChapter ? 'crumb-current' : ''}`} 
                                    onClick={() => {
                                        updateNavigation(selectedLevel?.id, selectedSubject?.id, null);
                                    }}
                                >
                                    {selectedSubject.name}
                                </button>
                             </>
                        )}
                        
                        {selectedChapter && (
                             <>
                                <span className="crumb-separator"><i className="fas fa-chevron-right"></i></span>
                                <span className="crumb-current">{selectedChapter.name}</span>
                             </>
                        )}
                    </div>
                )}

                {/* Content Area */}
                {!selectedLevel ? renderLevels() : 
                 !selectedSubject ? renderSubjects() : 
                 selectedChapter ? (
                    <ChapterMaterialsView 
                        materials={chapterMaterials}
                        language={activeLanguage === 'telugu' ? 'te' : 'en'}
                        onStartExam={goToChapterExam}
                        chapterName={selectedChapter.name}
                    />
                 ) : renderChapters()}

            </div>
        </section>
    );
};

export default StudentAcademicsExplorer;
