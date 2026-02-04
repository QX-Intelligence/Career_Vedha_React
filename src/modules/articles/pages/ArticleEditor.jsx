import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import CustomSelect from '../../../components/ui/CustomSelect';
import LuxuryDateTimePicker from '../../../components/ui/LuxuryDateTimePicker';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import { newsService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getRoleInitials } from '../../../utils/roleUtils';
import API_CONFIG from '../../../config/api.config';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import './ArticleEditor.css';
import '../../../styles/Dashboard.css';

const ArticleEditor = () => {
    const { section: sectionParam, id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const isEditMode = !!id;

    // UI State
    const [activeTab, setActiveTab] = useState('english'); // 'english' or 'telugu'
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [formData, setFormData] = useState({
        section: '',
        slug: '',
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
        status: 'DRAFT'
    });

    // Admin Publish State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const userRole = getUserContext().role;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'EDITOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }

        // Fetch categories/sections
        fetchMetadata();
    }, [navigate]);

    const fetchMetadata = async () => {
        try {
            // Fetch categories to derive available sections
            // Fetch categories to derive available sections
            // Removed limit as per user request
            const response = await newsService.getAdminCategories();
            console.log('Categories Response:', response); // Debugging

            const allCategories = response.results || [];
            
            // Extract unique sections
            const uniqueSections = [...new Set(allCategories.map(cat => cat.section))];
            
            // Format for dropdown
            const dynamicSections = uniqueSections.map(sec => ({
                id: sec,
                name: sec.charAt(0).toUpperCase() + sec.slice(1).replace(/_/g, ' ')
            }));

            // No fallbacks - strictly API based
            setSections(dynamicSections);
        } catch (error) {
            console.error('Error fetching metadata (sections):', error);
            setSections([]);
        }
    };

    // Fetch categories when section changes
    useEffect(() => {
        if (formData.section) {
            const fetchCats = async () => {
                try {
                    const data = await newsService.getTaxonomyBySection(formData.section);
                    setCategories(data || []);
                } catch (err) {
                    console.error('Failed to load categories');
                }
            };
            fetchCats();
        }
    }, [formData.section]);

    useEffect(() => {
        if (isEditMode) {
            const fetchArticle = async () => {
                try {
                    let article;
                    // Check if 'id' is a primary key (numeric) or slug
                    const isNumericId = /^\d+$/.test(id);
                    
                    if (isNumericId) {
                        article = await newsService.getAdminArticleDetail(id);
                    } else {
                        // Fallback for slug-based access - Note: this may still return single language 
                        // unless we add a CMS slug-based endpoint
                        article = await newsService.getArticleDetail(sectionParam, id, 'en');
                    }
                    
                    // Robust translation mapping from any response format
                    const translations = article.translations || [];
                    const telTrans = translations.find(t => t.language === 'te' || t.language_code === 'te');
                    const engTrans = translations.find(t => t.language === 'en' || t.language_code === 'en');

                    setFormData({
                        ...article,
                        section: article.section || sectionParam || '',
                        // English mapping
                        eng_title: article.eng_title || engTrans?.title || (article.language === 'en' ? article.title : ''),
                        eng_content: article.eng_content || engTrans?.content || (article.language === 'en' ? article.content : ''),
                        eng_summary: article.eng_summary || engTrans?.summary || (article.language === 'en' ? article.summary : ''),
                        
                        // Telugu mapping
                        tel_title: article.tel_title || telTrans?.title || (article.language === 'te' ? article.title : ''),
                        tel_content: article.tel_content || telTrans?.content || (article.language === 'te' ? article.content : ''),
                        tel_summary: article.tel_summary || telTrans?.summary || (article.language === 'te' ? article.summary : ''),
                        
                        category_ids: article.article_categories ? article.article_categories.map(c => c.category_id) : (article.categories ? article.categories.map(c => c.id) : [])
                    });
                } catch (error) {
                    console.error('Error fetching article:', error);
                    showSnackbar('Failed to load article data', 'error');
                    navigate('/dashboard?tab=articles');
                } finally {
                    setLoading(false);
                }
            };
            fetchArticle();
        }
    }, [id, sectionParam, isEditMode, navigate, showSnackbar]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryToggle = (catId) => {
        setFormData(prev => {
            const current = prev.category_ids || [];
            const updated = current.includes(catId)
                ? current.filter(id => id !== catId)
                : [...current, catId];
            return { ...prev, category_ids: updated };
        });
    };

    const handleDirectPublish = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (saving) return; // Prevent double submission
        
        setSaving(true);
        try {
            let targetId = id;
            
            // For NEW articles: Create with PUBLISHED status and scheduled_at in one request
            if (!isEditMode) {
                // Transform frontend format to backend format
                const translations = [];
                
                // Add Telugu translation if exists
                if (formData.tel_title || formData.tel_content) {
                    translations.push({
                        language: 'te',
                        title: formData.tel_title || '',
                        content: formData.tel_content || '',
                        summary: formData.tel_summary || ''
                    });
                }
                
                // Add English translation if exists
                if (formData.eng_title || formData.eng_content) {
                    translations.push({
                        language: 'en',
                        title: formData.eng_title || '',
                        content: formData.eng_content || '',
                        summary: formData.eng_summary || ''
                    });
                }
                
                const payload = {
                    slug: formData.slug,
                    section: formData.section,
                    translations: translations,
                    category_ids: formData.category_ids || [],
                    tags: formData.tags || [],
                    keywords: formData.keywords || [],
                    canonical_url: formData.canonical_url || '',
                    meta_title: formData.meta_title || '',
                    meta_description: formData.meta_description || '',
                    og_title: formData.og_title || '',
                    og_description: formData.og_description || '',
                    og_image_url: formData.og_image_url || '',
                    noindex: formData.noindex || false,
                    expires_at: formData.expires_at || null,
                    status: scheduleDate ? 'SCHEDULED' : 'PUBLISHED'
                };
                
                // Add scheduled_at if scheduling
                if (scheduleDate) {
                    payload.scheduled_at = new Date(scheduleDate).toISOString();
                }
                
                const newArticle = await newsService.createArticle(payload);
                targetId = newArticle.id;
            } else {
                // For EXISTING articles: Update first, then call direct-publish
                await newsService.updateArticle(id, formData);
                
                const payload = scheduleDate ? { scheduled_at: new Date(scheduleDate).toISOString() } : {};
                await newsService.directPublish(targetId, payload);
            }

            showSnackbar(`Article ${scheduleDate ? 'scheduled' : 'published'} successfully`, 'success');
            navigate('/dashboard?tab=articles');
        } catch (error) {
            console.error('Publish error:', error);
            showSnackbar(error.response?.data?.error || 'Failed to publish article', 'error');
        } finally {
            setSaving(false);
            setShowPublishModal(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let targetId = id;
            
            if (isEditMode) {
                await newsService.updateArticle(id, formData);
            } else {
                const newArticle = await newsService.createArticle(formData);
                targetId = newArticle.id;
            }

            // Always try to sync categories if we have an ID
            if (targetId && formData.category_ids) {
                await newsService.assignCategories(targetId, formData.category_ids);
            }

            showSnackbar(isEditMode ? 'Article updated successfully' : 'Article created as Draft', 'success');
            navigate('/dashboard?tab=articles');
        } catch (error) {
            console.error('Save error:', error);
            showSnackbar(error.response?.data?.error || 'Failed to save article', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="cms-loading-overlay">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading article editor...</p>
        </div>
    );





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
                <div className="editor-header">
                    <div className="editor-title-area">
                        <h1>{isEditMode ? 'Refine Article' : 'Compose New Article'}</h1>
                        <p>Masterpiece in the making for your audience</p>
                    </div>
                    <div className="editor-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard?tab=articles')}>Discard</button>
                        
                        {isAdmin && (
                            <button 
                                type="button" 
                                className="btn-primary btn-publish" 
                                onClick={() => setShowPublishModal(true)}
                                disabled={saving}
                                style={{ background: 'var(--success-500)', borderColor: 'var(--success-600)' }}
                            >
                                <i className="fas fa-rocket"></i> Publish / Schedule
                            </button>
                        )}
                        
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update Draft' : 'Save Draft'}
                        </button>
                    </div>
                </div>

                {/* Publish Modal - Luxury Redesign */}
                {showPublishModal && (
                    <div className="am-modal-overlay">
                        <div className="am-modal" style={{ maxWidth: '600px' }}>
                            <div className="am-modal-header">
                                <div className="am-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                                    <i className="fas fa-rocket" style={{ width: '32px', height: '32px', fontSize: '1rem', background: 'var(--primary-yellow-light)', color: 'var(--primary-yellow-hover)', boxShadow: 'none' }}></i>
                                    Publish Options
                                </div>
                                <button type="button" className="am-action-btn" onClick={() => setShowPublishModal(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="am-modal-body" style={{ textAlign: 'left', padding: '1.5rem' }}>
                                <div className="publish-form-wrapper">
                                    <div className="form-section">
                                        <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--slate-700)', marginBottom: '0.75rem', display: 'block' }}>
                                            SCHEDULE PUBLICATION (OPTIONAL)
                                        </label>
                                        
                                        <LuxuryDateTimePicker 
                                            value={scheduleDate} 
                                            onChange={setScheduleDate} 
                                            placeholder="Pick Date & Time"
                                        />

                                        <p className="helper-text" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-info-circle"></i> Leave blank to publish immediately.
                                        </p>
                                    </div>

                                    <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--slate-100)' }}>
                                        <button type="button" className="btn-secondary" onClick={() => setShowPublishModal(false)} style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleDirectPublish}
                                            className="btn-primary" 
                                            disabled={saving}
                                            style={{ 
                                                background: 'var(--primary-yellow)', 
                                                color: 'var(--slate-900)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                padding: '0.75rem 2rem',
                                                fontWeight: '800',
                                                boxShadow: '0 4px 12px rgba(250, 204, 21, 0.4)'
                                            }}
                                        >
                                            {saving ? <i className="fas fa-spinner fa-spin"></i> : (scheduleDate ? <i className="fas fa-clock"></i> : <i className="fas fa-rocket"></i>)}
                                            {scheduleDate ? 'Schedule' : 'Publish Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="editor-grid">
                    <div className="editor-main-panel">
                        
                        <div className="language-selector-tabs">
                            <button type="button" className={`lang-tab ${activeTab === 'english' ? 'active' : ''}`} onClick={() => setActiveTab('english')}>
                                <i className="fas fa-font"></i> English Content
                            </button>
                            <button type="button" className={`lang-tab ${activeTab === 'telugu' ? 'active' : ''}`} onClick={() => setActiveTab('telugu')}>
                                <i className="fas fa-language"></i> Telugu Content
                            </button>
                        </div>

                        <div className="glass-card">
                            {activeTab === 'english' ? (
                                <div className="form-section">
                                    <div className="form-section">
                                        <label>Title (English)</label>
                                        <input name="eng_title" value={formData.eng_title} onChange={handleInputChange} placeholder="Enter a compelling headline in English..." required />
                                    </div>
                                    <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                        <label>Summary / Excerpt (English)</label>
                                        <textarea name="eng_summary" value={formData.eng_summary} onChange={handleInputChange} placeholder="Short teaser in English..." rows="3" />
                                    </div>
                                    <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                        <label>Main Body (English HTML)</label>
                                        <textarea name="eng_content" value={formData.eng_content} onChange={handleInputChange} placeholder="HTML content supported..." rows="20" required />
                                        <span className="html-editor-info"><i className="fas fa-code"></i> Raw HTML Editor - Use tags for formatting (p, br, h3, ul, li)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-section">
                                    <div className="form-section">
                                        <label>Title (Telugu)</label>
                                        <input name="tel_title" value={formData.tel_title} onChange={handleInputChange} placeholder="తెలుగులో హెడ్ లైన్ ఇవ్వండి..." />
                                    </div>
                                    <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                        <label>Summary / Excerpt (Telugu)</label>
                                        <textarea name="tel_summary" value={formData.tel_summary} onChange={handleInputChange} placeholder="తెలుగులో సారాంశం..." rows="3" />
                                    </div>
                                    <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                        <label>Main Body (Telugu HTML)</label>
                                        <textarea name="tel_content" value={formData.tel_content} onChange={handleInputChange} placeholder="తెలుగు కంటెంట్..." rows="20" />
                                        <span className="html-editor-info"><i className="fas fa-code"></i> Raw HTML Editor for Telugu translation</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-card" style={{ marginTop: '2rem' }}>
                            <div className="side-card-title">Categorization & Tags</div>
                            <div className="form-row" style={{ marginTop: '1.5rem' }}>
                                <div className="form-section">
                                    <label>Tags</label>
                                    <input name="tags" value={formData.tags} onChange={handleInputChange} placeholder="news, updates, primary" />
                                </div>
                                <div className="form-section">
                                    <label>Sections</label>
                                    <CustomSelect 
                                        value={formData.section} 
                                        onChange={(val) => setFormData(prev => ({...prev, section: val}))}
                                        options={sections.map(s => s.id)}
                                        placeholder="Select Destination"
                                    />
                                </div>
                            </div>

                            <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                <label>Categories (Select Multiple)</label>
                                <div className="categories-selection-grid">
                                    {categories.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select a section to see categories</p>
                                    ) : (
                                        categories.map(cat => (
                                            <div key={cat.id} className={`category-pill-item ${formData.category_ids.includes(cat.id) ? 'active' : ''}`} onClick={() => handleCategoryToggle(cat.id)}>
                                                {cat.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-side-panel">
                        <div className="glass-card">
                            <div className="side-card-title">Article Configuration</div>
                            <div className="form-section">
                                <label>URL Slug</label>
                                <input name="slug" value={formData.slug} onChange={handleInputChange} placeholder="e.g. ap-inter-results-2024" required disabled={isEditMode} />
                            </div>
                            
                            <div className="form-section" style={{ marginTop: '1.5rem' }}>
                                <label>Expiry Date (Optional)</label>
                                <input type="date" name="expires_at" value={formData.expires_at} onChange={handleInputChange} />
                            </div>

                            <div className="status-toggle-container" style={{ marginTop: '1.5rem' }}>
                                <span>No-Index (SEO Hide)</span>
                                <label className="switch">
                                    <input type="checkbox" name="noindex" checked={formData.noindex} onChange={handleInputChange} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <div className="glass-card">
                            <div className="side-card-title">SEO Optimization</div>
                            <div className="form-section">
                                <label>Keywords</label>
                                <textarea name="keywords" value={formData.keywords} onChange={handleInputChange} rows="2" placeholder="keyword1, keyword2..." />
                            </div>
                            <div className="form-section" style={{ marginTop: '1rem' }}>
                                <label>Meta Description</label>
                                <textarea name="meta_description" value={formData.meta_description} onChange={handleInputChange} rows="3" placeholder="SEO Description..." />
                            </div>
                        </div>

                        <div className="glass-card">
                            <div className="side-card-title">Social Visibility</div>
                            <div className="form-section">
                                <label>OG Image URL</label>
                                <input name="og_image_url" value={formData.og_image_url} onChange={handleInputChange} placeholder="https://..." />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </CMSLayout>
    );
};

export default ArticleEditor;
