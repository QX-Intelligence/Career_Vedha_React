import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSelect from '../../../components/ui/CustomSelect';
import LuxuryDateTimePicker from '../../../components/ui/LuxuryDateTimePicker';
import MediaLibraryModal from '../../media/components/MediaLibraryModal';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import { newsService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import API_CONFIG from '../../../config/api.config';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import { useArticle, useCreateArticle, useUpdateArticle, usePublishArticle, useAssignCategories } from '../../../hooks/useArticles';
import { useAdminCategories, useCategoriesBySection, useSections, useCategoryChildren, useFetchCategoryChildren } from '../../../hooks/useTaxonomy';
import './ArticleEditor.css';
import '../../../styles/Dashboard.css';
import ReactQuill from 'react-quill';

const ArticleEditor = () => {
    const { section: sectionParam, id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const isEditMode = !!id;

    // UI State
    const [isCmsOpen, setIsCmsOpen] = useState(true);
    
    const [formData, setFormData] = useState({
        section: '',
        slug: '',
        language: 'te', // Default Telugu
        eng_title: '',
        eng_content: '',
        eng_summary: '',
        tel_title: '',
        tel_content: '',
        tel_summary: '',
        tags: '',
        category_ids: [],
        noindex: false,
        keywords: '',
        canonical_url: '',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_image_url: '',
        og_description: '',
        expires_at: '',
        status: 'DRAFT',
        youtube_url: '',
        additional_sections: [],
        is_top_story: false
    });

    // Hierarchical taxonomy state
    const [level1, setLevel1] = useState(''); // Section (e.g. Academics)
    const [level2, setLevel2] = useState(''); // Root Category
    const [level3, setLevel3] = useState(''); // Sub Category
    const [level4, setLevel4] = useState(''); // Segment
    const [level5, setLevel5] = useState(''); // Topic
    
    // Multi-selection state
    const [selectedCategories, setSelectedCategories] = useState([]);
    
    // React Query hooks
    const { data: articleData, isLoading: loadingArticle } = useArticle(id, { enabled: isEditMode });
    const { data: adminCategoriesData } = useAdminCategories();
    const { data: sectionCategories } = useCategoriesBySection(level1);
    const { data: dynamicSections } = useSections();
    
    // Cascading children hooks — Level 2 uses sectionCategories (top-level cats for section)
    // Level 3 & 4 use actual category IDs from selection
    const { data: level3Options } = useCategoryChildren(level1, level2 || null);
    const { data: level4Options } = useCategoryChildren(level1, level3 || null);
    const { data: level5Options } = useCategoryChildren(level1, level4 || null);
    
    const createArticleMutation = useCreateArticle();
    const updateArticleMutation = useUpdateArticle();
    const publishArticleMutation = usePublishArticle();
    const assignCategoriesMutation = useAssignCategories();
    
    // Mutation loading state
    const isSaving = createArticleMutation.isPending || 
                     updateArticleMutation.isPending || 
                     publishArticleMutation.isPending || 
                     assignCategoriesMutation.isPending;

    // Derived state
    const sections = Array.isArray(dynamicSections) ? dynamicSections : (dynamicSections?.results || []);
    const categories = sectionCategories || [];

    // Media Upload State
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerMediaId, setBannerMediaId] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    
    const [mainFile, setMainFile] = useState(null);
    const [mainMediaId, setMainMediaId] = useState(null);
    const [mainPreview, setMainPreview] = useState(null);
    
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfFileName, setPdfFileName] = useState('');
    
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [activeMediaTarget, setActiveMediaTarget] = useState('banner');

    // Publish State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const userRole = getUserContext().role;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

    // Related Articles Preview
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];
        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    // Populate form when article data is loaded
    useEffect(() => {
        if (articleData && isEditMode) {
            const article = articleData;
            const translations = article.translations || [];
            const telTrans = translations.find(t => t.language === 'te' || t.language_code === 'te');
            const engTrans = translations.find(t => t.language === 'en' || t.language_code === 'en');

            setFormData({
                ...article,
                section: article.section || sectionParam || '',
                language: telTrans ? 'te' : 'en',
                eng_title: article.eng_title || engTrans?.title || (article.language === 'en' ? article.title : ''),
                eng_content: article.eng_content || engTrans?.content || (article.language === 'en' ? article.content : ''),
                eng_summary: article.eng_summary || engTrans?.summary || (article.language === 'en' ? article.summary : ''),
                tel_title: article.tel_title || telTrans?.title || (article.language === 'te' ? article.title : ''),
                tel_content: article.tel_content || telTrans?.content || (article.language === 'te' ? article.content : ''),
                tel_summary: article.tel_summary || telTrans?.summary || (article.language === 'te' ? article.summary : ''),
                category_ids: article.article_categories ? article.article_categories.map(c => c.category_id) : (article.categories ? article.categories.map(c => c.id) : []),
                youtube_url: article.youtube_url || '',
                is_top_story: article.is_top_story || false,
                additional_sections: article.additional_sections || [],
            });

            // Set Level 1 from section
            if (article.section) {
                setLevel1(article.section);
            }

            // Prefill Media Previews
            const mediaLinks = article.media_links || [];
            const bannerMedia = mediaLinks.find(m => m.usage === 'BANNER');
            const mainMedia = mediaLinks.find(m => m.usage === 'MAIN');

            if (bannerMedia && bannerMedia.media_details) {
                setBannerMediaId(bannerMedia.media_details.id);
                setBannerPreview(bannerMedia.media_details.url);
            }
            if (mainMedia && mainMedia.media_details) {
                setMainMediaId(mainMedia.media_details.id);
                setMainPreview(mainMedia.media_details.url);
            }
        }
    }, [articleData, isEditMode, sectionParam]);

    // Sync level1 to formData.section
    useEffect(() => {
        if (level1) {
            setFormData(prev => ({ ...prev, section: level1 }));
            setSelectedCategories([]); // Clear selection when section changes
        }
    }, [level1]);

    // Reset children when parent changes
    useEffect(() => { setLevel2(''); setLevel3(''); setLevel4(''); setLevel5(''); }, [level1]);
    useEffect(() => { setLevel3(''); setLevel4(''); setLevel5(''); }, [level2]);
    useEffect(() => { setLevel4(''); setLevel5(''); }, [level3]);
    useEffect(() => { setLevel5(''); }, [level4]);

    // Help keep selected categories in sync with formData
    useEffect(() => {
        setFormData(prev => ({ 
            ...prev, 
            category_ids: selectedCategories.map(cat => cat.id)
        }));
    }, [selectedCategories]);

    // Helper to add a category to the list
    const addCategory = useCallback((id, name, level) => {
        if (!id) return;
        setSelectedCategories(prev => {
            if (prev.find(c => c.id === id)) return prev;
            return [...prev, { id, name, level }];
        });
    }, []);

    // Helper to remove a category from the list
    const removeCategory = (id) => {
        setSelectedCategories(prev => prev.filter(c => c.id !== id));
    };

    const [errors, setErrors] = useState({});
    
    const isContentEmpty = (content) => {
        if (!content) return true;
        const hasMedia = content.includes('<img') || content.includes('<iframe');
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        return !textContent && !hasMedia;
    };

    const validateForm = () => {
        const newErrors = {};
        const lang = formData.language;
        
        // Check content based on selected language
        if (lang === 'en') {
            if (!formData.eng_title?.trim()) newErrors.eng_title = true;
            if (isContentEmpty(formData.eng_content)) newErrors.eng_content = true;
        } else {
            if (!formData.tel_title?.trim()) newErrors.tel_title = true;
            if (isContentEmpty(formData.tel_content)) newErrors.tel_content = true;
        }

        if (Object.keys(newErrors).length > 0) {
            showSnackbar('Please fill in the heading and content', 'error');
            setErrors(newErrors);
            return false;
        }

        if (!formData.slug?.trim()) {
            newErrors.slug = true;
            showSnackbar('URL Slug is required', 'error');
            setErrors(newErrors);
            return false;
        }

        if (!level1) {
            newErrors.level1 = true;
            showSnackbar('Please select a Category (Level 1)', 'error');
            setErrors(newErrors);
            return false;
        }

        if (!mainFile && !mainMediaId && !bannerFile && !bannerMediaId) {
            newErrors.media = true;
            showSnackbar('Please upload at least one image', 'error');
            setErrors(newErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Effect to fetch related articles preview
    useEffect(() => {
        const fetchRelatedPreview = async () => {
            if (!formData.section || (formData.category_ids.length === 0 && !formData.tags)) {
                setRelatedArticles([]);
                return;
            }
            try {
                setLoadingRelated(true);
                const results = await newsService.getAdminArticles?.({
                    section: formData.section,
                    limit: 5
                }) || { results: [] };
                
                const tagsToMatch = (formData.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                const filtered = results.results?.filter(a => {
                    if (a.id == id) return false;
                    const articleTags = a.tags || [];
                    return articleTags.some(at => tagsToMatch.includes(at.toLowerCase())) || 
                           a.article_categories?.some(ac => formData.category_ids.includes(ac.category_id));
                }).slice(0, 5) || [];
                setRelatedArticles(filtered);
            } catch (error) {
                console.error("Error fetching related preview:", error);
            } finally {
                setLoadingRelated(false);
            }
        };
        const timeoutId = setTimeout(fetchRelatedPreview, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.category_ids, formData.tags, formData.section, id]);

    const handleEditorChange = (name, content) => {
        setFormData(prev => ({ ...prev, [name]: content }));
    };
    
    // Enhanced Quill modules with full formatting
    const modules = {
        toolbar: [
            [{ 'font': [] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['blockquote', 'code-block'],
            ['clean']
        ],
    };

    const formats = [
        'font', 'header', 'size',
        'bold', 'italic', 'underline', 'strike',
        'script',
        'color', 'background',
        'list', 'bullet', 'indent', 'align',
        'link', 'image', 'video',
        'blockquote', 'code-block'
    ];

    // Media Upload Handlers
    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 10 * 1024 * 1024;
            if (!validTypes.includes(file.type)) {
                showSnackbar('Invalid file type. Please upload an image (JPEG, PNG, WebP).', 'error');
                return;
            }
            if (file.size > maxSize) {
                showSnackbar('File size exceeds 10MB limit.', 'error');
                return;
            }
            // Set as both banner and main for simplicity
            setBannerFile(file);
            setMainFile(file);
            setBannerMediaId(null);
            setMainMediaId(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
                setMainPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                showSnackbar('Please upload a PDF file.', 'error');
                return;
            }
            if (file.size > 25 * 1024 * 1024) {
                showSnackbar('PDF size exceeds 25MB limit.', 'error');
                return;
            }
            setPdfFile(file);
            setPdfFileName(file.name);
        }
    };

    const handleMediaLibrarySelect = (mediaId, mediaUrl) => {
        if (activeMediaTarget === 'image') {
            setBannerMediaId(mediaId);
            setMainMediaId(mediaId);
            setBannerFile(null);
            setMainFile(null);
            setBannerPreview(mediaUrl);
            setMainPreview(mediaUrl);
        }
        setShowMediaLibrary(false);
    };

    const clearImageMedia = () => {
        setBannerFile(null);
        setBannerMediaId(null);
        setBannerPreview(null);
        setMainFile(null);
        setMainMediaId(null);
        setMainPreview(null);
    };

    const clearPdf = () => {
        setPdfFile(null);
        setPdfFileName('');
    };

    const handleDirectPublish = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (publishArticleMutation.isPending || createArticleMutation.isPending) return;
        if (!validateForm()) return;

        try {
            const formDataToSubmit = new FormData();
            
            // Required fields
            formDataToSubmit.append('slug', formData.slug);
            formDataToSubmit.append('section', formData.section);
            
            // Content fields
            formDataToSubmit.append('tel_title', formData.tel_title || '');
            formDataToSubmit.append('tel_content', formData.tel_content || '');
            formDataToSubmit.append('tel_summary', formData.tel_summary || '');
            formDataToSubmit.append('eng_title', formData.eng_title || '');
            formDataToSubmit.append('eng_content', formData.eng_content || '');
            formDataToSubmit.append('eng_summary', formData.eng_summary || '');

            // Taxonomy and Sections
            formData.category_ids.forEach(id => formDataToSubmit.append('category_ids', id));
            formData.additional_sections.forEach(sec => formDataToSubmit.append('additional_sections', sec));

            // Media
            if (bannerFile) formDataToSubmit.append('banner_file', bannerFile);
            if (mainFile) formDataToSubmit.append('main_file', mainFile);

            // Status and Scheduling
            formDataToSubmit.append('status', scheduleDate ? 'PUBLISHED' : 'PUBLISHED'); // Publisher+ context
            if (scheduleDate) {
                formDataToSubmit.append('scheduled_at', new Date(scheduleDate).toISOString());
            }

            if (!isEditMode) {
                const newArticle = await newsService.createArticle(formDataToSubmit);
                showSnackbar(`Article ${scheduleDate ? 'scheduled' : 'published'} successfully`, 'success');
            } else {
                await newsService.updateArticle(id, formDataToSubmit);
                showSnackbar(`Article updated successfully`, 'success');
            }

            navigate('/dashboard?tab=articles');
        } catch (error) {
            console.error('Publish error:', error);
            showSnackbar(error.response?.data?.error || 'Failed to publish article', 'error');
        } finally {
            setShowPublishModal(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (createArticleMutation.isPending || updateArticleMutation.isPending) return;
        if (!validateForm()) return;

        try {
            const formDataToSubmit = new FormData();
            
            // Required fields
            formDataToSubmit.append('slug', formData.slug);
            formDataToSubmit.append('section', formData.section);
            
            // Content fields
            formDataToSubmit.append('tel_title', formData.tel_title || '');
            formDataToSubmit.append('tel_content', formData.tel_content || '');
            formDataToSubmit.append('tel_summary', formData.tel_summary || '');
            formDataToSubmit.append('eng_title', formData.eng_title || '');
            formDataToSubmit.append('eng_content', formData.eng_content || '');
            formDataToSubmit.append('eng_summary', formData.eng_summary || '');

            // Taxonomy and Sections
            formData.category_ids.forEach(id => formDataToSubmit.append('category_ids', id));
            formData.additional_sections.forEach(sec => formDataToSubmit.append('additional_sections', sec));

            // Media
            if (bannerFile) formDataToSubmit.append('banner_file', bannerFile);
            if (mainFile) formDataToSubmit.append('main_file', mainFile);

            // Status - Use DRAFT for handleSave
            formDataToSubmit.append('status', 'DRAFT');

            if (isEditMode) {
                await newsService.updateArticle(id, formDataToSubmit);
                showSnackbar('Article updated successfully', 'success');
            } else {
                await newsService.createArticle(formDataToSubmit);
                showSnackbar('Article created as Draft', 'success');
            }

            navigate('/dashboard?tab=articles');
        } catch (error) {
            console.error('Save error:', error);
            showSnackbar(error.response?.data?.error || 'Failed to save article', 'error');
        }
    };

    const isLoading = loadingArticle && isEditMode;
    
    if (isLoading) return (
        <div className="cms-loading-overlay">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading article editor...</p>
        </div>
    );

    // Current language helpers
    const lang = formData.language;
    const titleField = lang === 'en' ? 'eng_title' : 'tel_title';
    const contentField = lang === 'en' ? 'eng_content' : 'tel_content';
    const summaryField = lang === 'en' ? 'eng_summary' : 'tel_summary';
    const titlePlaceholder = lang === 'en' ? 'Enter a compelling headline...' : 'హెడ్ లైన్ ఇవ్వండి...';
    const contentPlaceholder = lang === 'en' ? 'Write your article content here...' : 'కంటెంట్ ఇక్కడ రాయండి...';
    const summaryPlaceholder = lang === 'en' ? 'Short summary/excerpt...' : 'చిన్న సారాంశం...';

    // Build level 2/3/4 dropdown options from categories tree
    const level2List = (Array.isArray(categories) ? categories : []).map(c => ({
        value: c.id?.toString() || c.name,
        label: c.name
    }));
    const level3List = (Array.isArray(level3Options) ? level3Options : []).map(c => ({
        value: c.id?.toString() || c.name,
        label: c.name
    }));
    const level4List = (Array.isArray(level4Options) ? level4Options : []).map(c => ({
        value: c.id?.toString() || c.name,
        label: c.name
    }));
    const level5List = (Array.isArray(level5Options) ? level5Options : []).map(c => ({
        value: c.id?.toString() || c.name,
        label: c.name
    }));

    const sidebarProps = {
        activeSection: 'articles',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: () => {
            api.post('/log-out').finally(() => navigate('/admin-login'));
        },
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: isEditMode ? 'Edit Article' : 'Create Article',
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <form className="article-editor-form" onSubmit={handleSubmit}>
                
                {/* ═══════ HEADER ═══════ */}
                <div className="ae-header">
                    <div className="ae-header-left">
                        <div className="ae-header-icon">
                            <i className="fas fa-newspaper"></i>
                        </div>
                        <div>
                            <h1>{isEditMode ? 'Edit Article' : 'Create New Article'}</h1>
                            <p>Fill in the details below to {isEditMode ? 'update' : 'create'} your article</p>
                        </div>
                    </div>
                    <div className="ae-header-actions">
                        <button type="button" className="ae-btn ae-btn-ghost" onClick={() => navigate('/dashboard?tab=articles')}>
                            <i className="fas fa-times"></i> Discard
                        </button>
                        <button type="submit" className="ae-btn ae-btn-draft" disabled={isSaving}>
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update' : 'Save Draft'}
                        </button>
                        {isAdmin && (
                            <button 
                                type="button" 
                                className="ae-btn ae-btn-publish" 
                                onClick={() => setShowPublishModal(true)}
                                disabled={isSaving}
                            >
                                <i className="fas fa-rocket"></i> Publish
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══════ PUBLISH MODAL ═══════ */}
                {showPublishModal && (
                    <div className="ae-modal-overlay">
                        <div className="ae-modal">
                            <div className="ae-modal-header">
                                <h3><i className="fas fa-rocket"></i> Publish Options</h3>
                                <button type="button" className="ae-modal-close" onClick={() => setShowPublishModal(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="ae-modal-body">
                                <label className="ae-label">SCHEDULE PUBLICATION (OPTIONAL)</label>
                                <LuxuryDateTimePicker 
                                    value={scheduleDate} 
                                    onChange={setScheduleDate} 
                                    placeholder="Pick Date & Time"
                                />
                                <p className="ae-helper"><i className="fas fa-info-circle"></i> Leave blank to publish immediately.</p>
                            </div>
                            <div className="ae-modal-footer">
                                <button type="button" className="ae-btn ae-btn-ghost" onClick={() => setShowPublishModal(false)}>Cancel</button>
                                <button type="button" onClick={handleDirectPublish} className="ae-btn ae-btn-publish" disabled={isSaving}>
                                    {isSaving ? <i className="fas fa-spinner fa-spin"></i> : (scheduleDate ? <i className="fas fa-clock"></i> : <i className="fas fa-rocket"></i>)}
                                    {scheduleDate ? 'Schedule' : 'Publish Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ MAIN FORM ═══════ */}
                <div className="ae-form-body">
                    
                    {/* ── STEP 1: Basic Info ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">1</span>
                            <h2>Basic Information</h2>
                        </div>
                        
                        <div className="ae-field">
                            <label className="ae-label">
                                Heading <span className="ae-required">*</span>
                            </label>
                            <input
                                name={titleField}
                                value={formData[titleField] || ''}
                                onChange={handleInputChange}
                                placeholder={titlePlaceholder}
                                className={`ae-input ${errors[titleField] ? 'ae-error' : ''}`}
                            />
                        </div>
                        
                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label">
                                    URL Slug <span className="ae-required">*</span>
                                </label>
                                <input
                                    name="slug"
                                    value={formData.slug || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ap-inter-results-2024"
                                    className={`ae-input ${errors.slug ? 'ae-error' : ''}`}
                                    disabled={isEditMode}
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label">
                                    Language <span className="ae-required">*</span>
                                </label>
                                <CustomSelect
                                    value={formData.language}
                                    onChange={(val) => setFormData(prev => ({...prev, language: val}))}
                                    options={[
                                        { value: 'te', label: '🇮🇳 Telugu' },
                                        { value: 'en', label: '🇬🇧 English' }
                                    ]}
                                    placeholder="Select Language"
                                />
                            </div>
                        </div>

                        <div className="ae-field">
                            <label className="ae-label">Summary / Excerpt</label>
                            <textarea
                                name={summaryField}
                                value={formData[summaryField] || ''}
                                onChange={handleInputChange}
                                placeholder={summaryPlaceholder}
                                rows="3"
                                className="ae-textarea"
                            ></textarea>
                        </div>
                    </div>

                    {/* ── STEP 2: Taxonomy ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">2</span>
                            <h2>Categorization</h2>
                        </div>

                        <div className="ae-taxonomy-grid">
                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-layer-group"></i>
                                    Level 1 – Section <span className="ae-required">*</span>
                                </label>
                                <CustomSelect
                                    value={level1}
                                    onChange={(val) => setLevel1(val)}
                                    options={sections.map(s => ({ value: s.slug || s.id, label: s.name }))}
                                    placeholder="Select Section"
                                    isInvalid={errors.level1}
                                />
                            </div>
                            
                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-sitemap"></i>
                                    Level 2 – Category
                                </label>
                                <CustomSelect
                                    value={level2}
                                    onChange={(val) => {
                                        setLevel2(val);
                                        const cat = (level2List || []).find(o => o.value === val);
                                        if (cat) addCategory(val, cat.label, 2);
                                    }}
                                    options={level2List}
                                    placeholder={level1 ? "Select Category" : "Select Section first"}
                                    disabled={!level1}
                                />
                            </div>
                            
                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-puzzle-piece"></i>
                                    Level 3 – Sub-Category
                                </label>
                                <CustomSelect
                                    value={level3}
                                    onChange={(val) => {
                                        setLevel3(val);
                                        const cat = (level3List || []).find(o => o.value === val);
                                        if (cat) addCategory(val, cat.label, 3);
                                    }}
                                    options={level3List}
                                    placeholder={level2 ? "Select Sub-Category" : "Select Category first"}
                                    disabled={!level2}
                                />
                            </div>
                            
                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-tag"></i>
                                    Level 4 – Segment
                                </label>
                                <CustomSelect
                                    value={level4}
                                    onChange={(val) => {
                                        setLevel4(val);
                                        const cat = (level4List || []).find(o => o.value === val);
                                        if (cat) addCategory(val, cat.label, 4);
                                    }}
                                    options={level4List}
                                    placeholder={level3 ? "Select Segment" : "Select Sub Category first"}
                                    disabled={!level3}
                                />
                            </div>

                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-bullseye"></i>
                                    Level 5 – Topic
                                </label>
                                <CustomSelect
                                    value={level5}
                                    onChange={(val) => {
                                        setLevel5(val);
                                        const cat = (level5List || []).find(o => o.value === val);
                                        if (cat) addCategory(val, cat.label, 5);
                                    }}
                                    options={level5List}
                                    placeholder={level4 ? "Select Topic" : "Select Segment first"}
                                    disabled={!level4}
                                />
                            </div>
                        </div>

                        {selectedCategories.length > 0 && (
                            <div className="ae-selected-categories">
                                <div className="ae-selected-label">
                                    <i className="fas fa-check-double"></i>
                                    Applied Categories ({selectedCategories.length})
                                </div>
                                <div className="ae-chips-container">
                                    {selectedCategories.map(cat => (
                                        <div key={cat.id} className="ae-category-chip">
                                            <span className="ae-chip-path">L{cat.level}:</span>
                                            {cat.name}
                                            <button 
                                                className="ae-chip-remove" 
                                                onClick={() => removeCategory(cat.id)}
                                                type="button"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="ae-field" style={{ marginTop: '1.5rem' }}>
                            <label className="ae-label">Tags</label>
                            <input
                                name="tags"
                                value={formData.tags || ''}
                                onChange={handleInputChange}
                                placeholder="news, updates, education (comma separated)"
                                className="ae-input"
                            />
                        </div>
                    </div>

                    {/* ── STEP 3: Media ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">3</span>
                            <h2>Media Uploads</h2>
                        </div>

                        <div className="ae-media-grid">
                            {/* Image Upload */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-image"></i>
                                    <span>Image</span>
                                    <span className="ae-size-hint">Max 10MB • JPEG, PNG, WebP</span>
                                </div>
                                
                                {(bannerPreview || mainPreview) ? (
                                    <div className="ae-media-preview">
                                        <img src={bannerPreview || mainPreview} alt="Preview" />
                                        <button type="button" className="ae-media-remove" onClick={clearImageMedia}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handleImageFileChange}
                                            id="image-upload"
                                            hidden
                                        />
                                        <label htmlFor="image-upload" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Click to upload image</span>
                                        </label>
                                        <div className="ae-upload-divider"><span>or</span></div>
                                        <button
                                            type="button"
                                            className="ae-btn ae-btn-server"
                                            onClick={() => { setActiveMediaTarget('image'); setShowMediaLibrary(true); }}
                                        >
                                            <i className="fas fa-server"></i> Select from Server
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* PDF Upload */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-file-pdf"></i>
                                    <span>PDF</span>
                                    <span className="ae-size-hint">Max 25MB • PDF only</span>
                                </div>
                                
                                {pdfFileName ? (
                                    <div className="ae-pdf-preview">
                                        <i className="fas fa-file-pdf ae-pdf-icon"></i>
                                        <span className="ae-pdf-name">{pdfFileName}</span>
                                        <button type="button" className="ae-media-remove-inline" onClick={clearPdf}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfFileChange}
                                            id="pdf-upload"
                                            hidden
                                        />
                                        <label htmlFor="pdf-upload" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Click to upload PDF</span>
                                        </label>
                                        <div className="ae-upload-divider"><span>or</span></div>
                                        <button
                                            type="button"
                                            className="ae-btn ae-btn-server"
                                            onClick={() => { setActiveMediaTarget('pdf'); setShowMediaLibrary(true); }}
                                        >
                                            <i className="fas fa-server"></i> Select from Server
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── STEP 4: Content Editor ── */}
                    <div className="ae-card ae-card-editor">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">4</span>
                            <h2>Article Content <span className="ae-lang-indicator">{lang === 'te' ? 'తెలుగు' : 'English'}</span></h2>
                        </div>
                        
                        <p className="ae-editor-hint">
                            <i className="fas fa-info-circle"></i>
                            Full-featured editor: Bold, Italic, Colors, Fonts, Images, Videos, Tables, and more. Works like a word processor.
                        </p>
                        
                        <div className="ae-quill-wrapper">
                            <ReactQuill 
                                theme="snow"
                                value={formData[contentField] || ''}
                                onChange={(content) => handleEditorChange(contentField, content)}
                                modules={modules}
                                formats={formats}
                                placeholder={contentPlaceholder}
                                className={errors[contentField] ? 'ae-quill-error' : ''}
                            />
                        </div>
                    </div>

                    {/* ── STEP 5: Additional Settings ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">5</span>
                            <h2>Additional Settings</h2>
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label"><i className="fab fa-youtube"></i> YouTube URL</label>
                                <input
                                    name="youtube_url"
                                    value={formData.youtube_url || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="ae-input"
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label"><i className="fas fa-calendar-alt"></i> Article Expiry Date</label>
                                <input
                                    type="date"
                                    name="expires_at"
                                    value={formData.expires_at || ''}
                                    onChange={handleInputChange}
                                    className="ae-input"
                                />
                            </div>
                        </div>

                        <div className="ae-toggle-row">
                            <div className="ae-toggle-item">
                                <span>Mark as Top Story</span>
                                <label className="ae-switch">
                                    <input type="checkbox" name="is_top_story" checked={formData.is_top_story || false} onChange={handleInputChange} />
                                    <span className="ae-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ── BOTTOM ACTIONS (Mobile) ── */}
                    <div className="ae-bottom-actions">
                        <button type="button" className="ae-btn ae-btn-ghost" onClick={() => navigate('/dashboard?tab=articles')}>
                            <i className="fas fa-times"></i> Discard
                        </button>
                        <button type="submit" className="ae-btn ae-btn-draft" disabled={isSaving}>
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update' : 'Save Draft'}
                        </button>
                        {isAdmin && (
                            <button type="button" className="ae-btn ae-btn-publish" onClick={() => setShowPublishModal(true)} disabled={isSaving}>
                                <i className="fas fa-rocket"></i> Publish
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Media Library Modal */}
            <MediaLibraryModal 
                isOpen={showMediaLibrary}
                onClose={() => setShowMediaLibrary(false)}
                onSelect={(id, url) => handleMediaLibrarySelect(id, url)}
                targetType={activeMediaTarget}
            />
        </CMSLayout>
    );
};

export default ArticleEditor;
