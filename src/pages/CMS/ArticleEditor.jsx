import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LuxuryTooltip from '../../components/ui/LuxuryTooltip';
import CustomSelect from '../../components/ui/CustomSelect';
import api, { getUserContext } from '../../services/api';
import { newsService } from '../../services';
import { useSnackbar } from '../../context/SnackbarContext';
import { getRoleInitials } from '../../utils/roleUtils';
import API_CONFIG from '../../config/api.config';
import './ArticleEditor.css';
import '../../styles/Dashboard.css';

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

    // Auth state
    const [userFullName, setUserFullName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userEmail, setUserEmail] = useState('');

    const [formData, setFormData] = useState({
        section: '',
        slug: '',
        eng_title: '',
        eng_content: '',
        tel_title: '',
        tel_content: '',
        summary: '',
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

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, email, isAuthenticated, firstName, lastName } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'EDITOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }

        setUserRole(role);
        setUserEmail(email);
        setUserFullName(firstName && lastName ? `${firstName} ${lastName}` : email);

        // Fetch categories/sections
        fetchMetadata();
    }, [navigate]);

    const fetchMetadata = async () => {
        try {
            // Static sections for now based on project context
            const availableSections = [
                { id: 'jobs', name: 'Jobs' },
                { id: 'notifications', name: 'Notifications' },
                { id: 'results', name: 'Results' },
                { id: 'academics', name: 'Academics' },
                { id: 'current_affairs', name: 'Current Affairs' },
                { id: 'study_materials', name: 'Study Materials' }
            ];
            setSections(availableSections);
        } catch (error) {
            console.error('Error fetching metadata:', error);
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
                    // Try to use section from URL if available
                    const article = await newsService.getArticleDetail(sectionParam, id);
                    
                    setFormData({
                        ...article,
                        eng_title: article.eng_title || article.title,
                        eng_content: article.eng_content || article.content,
                        tel_title: article.tel_title || '',
                        tel_content: article.tel_content || '',
                        category_ids: article.categories ? article.categories.map(c => c.id) : []
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditMode) {
                await newsService.updateArticle(id, formData);
                showSnackbar('Article updated successfully', 'success');
            } else {
                await newsService.createArticle(formData);
                showSnackbar('Article created as Draft', 'success');
            }
            navigate('/dashboard?tab=articles');
        } catch (error) {
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

    return (
        <div className="dashboard-wrapper">
             {/* Simple Sidebar Clone for Consistency */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo-circle"><i className="fas fa-graduation-cap"></i></div>
                    <span>Career Vedha</span>
                </div>
                <nav className="sidebar-menu">
                    <button className="menu-item" onClick={() => navigate('/dashboard')}><i className="fas fa-tachometer-alt"></i><span>Overview</span></button>
                    <button className="menu-item active" onClick={() => navigate('/dashboard?tab=articles')}><i className="fas fa-file-invoice"></i><span>Articles</span></button>
                    <button className="menu-item" onClick={() => navigate('/cms/jobs')}><i className="fas fa-briefcase"></i><span>Jobs</span></button>
                </nav>
            </aside>

            <div className="dashboard-main">
                <div className="content-container">
                    <form className="article-editor-form" onSubmit={handleSubmit}>
                        <div className="editor-header">
                            <div className="editor-title-area">
                                <h1>{isEditMode ? 'Refine Article' : 'Compose New Article'}</h1>
                                <p>Masterpiece in the making for your audience</p>
                            </div>
                            <div className="editor-actions">
                                <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard?tab=articles')}>Discard</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                    {isEditMode ? 'Update Content' : 'Save Draft'}
                                </button>
                            </div>
                        </div>

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
                                                <label>Main Body (Telugu HTML)</label>
                                                <textarea name="tel_content" value={formData.tel_content} onChange={handleInputChange} placeholder="తెలుగు కంటెంట్..." rows="20" />
                                                <span className="html-editor-info"><i className="fas fa-code"></i> Raw HTML Editor for Telugu translation</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="glass-card" style={{ marginTop: '2rem' }}>
                                    <div className="side-card-title">Categorization & Tags</div>
                                    <div className="form-section">
                                        <label>Summary / Excerpt</label>
                                        <textarea name="summary" value={formData.summary} onChange={handleInputChange} placeholder="Short teaser for cards (150-200 chars)..." rows="3" />
                                    </div>
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
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;
