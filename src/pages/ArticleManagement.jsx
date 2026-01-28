import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsService } from '../services';
import { useSnackbar } from '../context/SnackbarContext';
import { getUserContext } from '../services/api';
import CustomSelect from '../components/ui/CustomSelect';
import LuxuryCalendar from '../components/ui/LuxuryCalendar';
import LuxuryTooltip from '../components/ui/LuxuryTooltip';
import '../styles/ArticleManagement.css';

const ArticleManagement = ({ activeLanguage }) => {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { role: userRole } = getUserContext();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [articleToDeactivate, setArticleToDeactivate] = useState(null);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [articleToActivate, setArticleToActivate] = useState(null);
    const [filterDate, setFilterDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState('PUBLISHED');
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [articleToFeature, setArticleToFeature] = useState(null);
    const [featureData, setFeatureData] = useState({
        feature_type: 'TOP',
        section: '',
        rank: 1
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            if (searchQuery.trim()) {
                const results = await newsService.searchArticles(searchQuery);
                setArticles(results.map(r => ({
                    id: r.article_id,
                    title: r.title,
                    slug: r.slug,
                    section: r.section || 'academics',
                    status: r.status || 'PUBLISHED',
                    translations: r.translations || [{ title: r.title, language: r.language }]
                })));
            } else {
                // Fetch admin list and dedicated features across all major sections (Home, Academics, Jobs, etc.)
                // Including common variations to handle capitalization differences in backend
                const sectionIds = ['', 'academics', 'Academics', 'jobs', 'Jobs', 'tech', 'Tech', 'business', 'Business'];
                const featureTypes = ['HERO', 'TOP', 'BREAKING', 'EDITOR_PICK'];

                const featurePromises = [];
                sectionIds.forEach(sId => {
                    featureTypes.forEach(fType => {
                        featurePromises.push(newsService.getPinnedArticles({ feature_type: fType, section: sId, limit: 50 }));
                    });
                });

                // Also fetch home content as a robust fallback for "current" pins
                const [adminArticlesResponse, homeDataTe, homeDataEn, ...allFeatureResults] = await Promise.all([
                    newsService.getAdminArticles(),
                    newsService.getHomeContent('te'),
                    newsService.getHomeContent('en'),
                    ...featurePromises
                ]);

                // 1. Normalize admin data
                const adminData = Array.isArray(adminArticlesResponse) ? adminArticlesResponse : (adminArticlesResponse?.results || []);

                // 2. Aggregate features from all sources
                const dedicatedPinned = allFeatureResults.flat();
                const homePinned = [...(homeDataTe.featured || []), ...(homeDataEn.featured || [])];

                const idMap = {};
                const slugMap = {};

                dedicatedPinned.forEach(item => {
                    const id = item.article_id || item.article?.id || item.pk || item.id;
                    const slug = item.article_slug || item.slug || item.article?.slug;
                    const feat = {
                        feature_type: item.feature_type || 'FEATURED',
                        section: item.section
                    };

                    if (id) {
                        const sId = String(id);
                        if (!idMap[sId]) idMap[sId] = [];
                        if (!idMap[sId].some(f => f.feature_type === feat.feature_type && f.section === feat.section)) {
                            idMap[sId].push(feat);
                        }
                    }
                    if (slug) {
                        if (!slugMap[slug]) slugMap[slug] = [];
                        if (!slugMap[slug].some(f => f.feature_type === feat.feature_type && f.section === feat.section)) {
                            slugMap[slug].push(feat);
                        }
                    }
                });

                homePinned.forEach(item => {
                    const id = item.article_id || item.article?.id || item.pk || item.id;
                    const slug = item.slug || item.article?.slug;
                    const feat = {
                        feature_type: item.feature_type || item.type || 'FEATURED',
                        section: item.section || ''
                    };

                    if (id) {
                        const sId = String(id);
                        if (!idMap[sId]) idMap[sId] = [];
                        if (!idMap[sId].some(f => f.feature_type === feat.feature_type && f.section === feat.section)) {
                            idMap[sId].push(feat);
                        }
                    }
                    if (slug) {
                        if (!slugMap[slug]) slugMap[slug] = [];
                        if (!slugMap[slug].some(f => f.feature_type === feat.feature_type && f.section === feat.section)) {
                            slugMap[slug].push(feat);
                        }
                    }
                });

                console.log('[Debug] ID Map Keys:', Object.keys(idMap));
                console.log('[Debug] Slug Map Keys:', Object.keys(slugMap));

                // 3. Merge and Enrich admin data
                const enrichedData = adminData.map(article => {
                    const existingFeatures = article.features || article.article_features || [];
                    const merged = [...existingFeatures];

                    const fromUnified = [
                        ...(idMap[String(article.id)] || []),
                        ...(slugMap[article.slug] || [])
                    ];

                    fromUnified.forEach(f => {
                        const exists = merged.some(ef =>
                            (ef.feature_type === f.feature_type || ef.type === f.feature_type) &&
                            (ef.section === f.section || !f.section)
                        );
                        if (!exists) merged.push(f);
                    });

                    return { ...article, features: merged };
                });

                setArticles(enrichedData);
                console.log(`[Articles] Synced ${enrichedData.filter(a => a.features?.length > 0).length} pinned items.`);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
            showSnackbar('Failed to fetch articles', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Trigger search when query changes (debounced ideally, but button for now or effect)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchArticles();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]); // Re-fetch when query changes

    // Override the generic fetchArticles effect 
    /*
    useEffect(() => {
        fetchArticles();
    }, []);
    */
    // We can merge the initial load and search load.

    // Correcting the duplication and logic flow:
    // Remove the original fetchArticles and useEffect, and use this merged one.



    const fetchCategories = async (section) => {
        try {
            const data = await newsService.getTaxonomyBySection(section);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryToggle = (catId) => {
        setFormData(prev => {
            const currentCats = prev.category_ids || [];
            const newCats = currentCats.includes(catId)
                ? currentCats.filter(id => id !== catId)
                : [...currentCats, catId];
            return { ...prev, category_ids: newCats };
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredArticles.map(a => a.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        try {
            // Sequential delete to handle potential errors individually or safer bulk op
            // Since backend deleteArticle takes one ID
            for (const id of selectedIds) {
                await newsService.deleteArticle(id);
            }
            showSnackbar(`${selectedIds.length} articles deleted`, 'success');
            setSelectedIds([]);
            setShowBulkDeleteModal(false);
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Bulk delete failed';
            showSnackbar(msg, 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };

            // Format tags and keywords for array (if backend expects list)
            if (typeof payload.tags === 'string') {
                payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
            if (typeof payload.keywords === 'string') {
                payload.keywords = payload.keywords.split(',').map(t => t.trim()).filter(Boolean);
            }

            if (isEditing && currentArticle) {
                // 1. Update Metadata (PATCH)
                await newsService.updateArticle(currentArticle.id, payload);

                // 2. Update Translations (POST /translation/) 
                // We do this sequentially to ensure they are processed.
                const translationPromises = [];
                
                // English
                if (payload.eng_title || payload.eng_content) {
                    translationPromises.push(newsService.updateTranslation(currentArticle.id, {
                        language: 'en',
                        title: payload.eng_title,
                        content: payload.eng_content || ''
                    }));
                }
                
                // Telugu
                if (payload.tel_title || payload.tel_content) {
                    translationPromises.push(newsService.updateTranslation(currentArticle.id, {
                        language: 'te',
                        title: payload.tel_title,
                        content: payload.tel_content || ''
                    }));
                }

                if (translationPromises.length > 0) {
                    await Promise.all(translationPromises);
                }

                showSnackbar('Article and translations updated successfully', 'success');
            } else {
                await newsService.createArticle(payload);
                showSnackbar('Article created successfully', 'success');
            }

            setShowForm(false);
            fetchArticles();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Operation failed';
            showSnackbar(msg, 'error');
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'review') {
                await newsService.moveToReview(id);
                showSnackbar('Article moved to REVIEW', 'success');
            } else if (action === 'publish') {
                await newsService.publishArticle(id);
                showSnackbar('Article PUBLISHED successfully', 'success');
            } else if (action === 'delete') {
                setArticleToDelete(id);
                setShowDeleteModal(true);
                return; // Wait for modal confirmation
            } else if (action === 'deactivate') {
                setArticleToDeactivate(id);
                setShowDeactivateModal(true);
                return;
            } else if (action === 'activate') {
                setArticleToActivate(id);
                setShowActivateModal(true);
                return;
            } else if (action === 'feature') {
                setArticleToFeature(id);
                setShowFeatureModal(true);
                return;
            } else if (action === 'unpin') {
                const article = articles.find(a => a.id === id);
                if (article && article.features && article.features.length > 0) {
                    // If multiple features, we might want to let the user pick, 
                    // but for common cases, we unpin the FIRST one or show a choice.
                    // For now, let's unpin all features for this article for simplicity OR the first one.
                    // The backend UnpinFeature takes article_id, feature_type, and section.
                    // Let's iterate and unpin all to be thorough? Or just the first.
                    // Sequential unpinning:
                    for (const feat of article.features) {
                        await newsService.unpinArticle(id, { feature_type: feat.feature_type, section: feat.section });
                    }
                    showSnackbar(`Removed ${article.features.length} pinning(s)`, 'success');
                } else {
                    showSnackbar('No active pinning found to remove', 'info');
                }
            }
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || `Action ${action} failed`;
            showSnackbar(msg, 'error');
        }
    };

    const handleFeatureSubmit = async () => {
        try {
            await newsService.pinArticle(articleToFeature, featureData);
            showSnackbar(`Article pinned as ${featureData.feature_type}`, 'success');
            setShowFeatureModal(false);
            setArticleToFeature(null);
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Feature failed';
            showSnackbar(msg, 'error');
        }
    };

    const handleConfirmDelete = async () => {
        if (!articleToDelete) return;
        try {
            await newsService.deleteArticle(articleToDelete);
            showSnackbar('Article deleted successfully', 'success');
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Delete failed';
            showSnackbar(msg, 'error');
        } finally {
            setShowDeleteModal(false);
            setArticleToDelete(null);
        }
    };

    const handleConfirmDeactivate = async () => {
        if (!articleToDeactivate) return;
        try {
            await newsService.deactivateArticle(articleToDeactivate);
            showSnackbar('Article deactivated (INACTIVE)', 'success');
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Deactivate failed';
            showSnackbar(msg, 'error');
        } finally {
            setShowDeactivateModal(false);
            setArticleToDeactivate(null);
        }
    };

    const handleConfirmActivate = async () => {
        if (!articleToActivate) return;
        try {
            await newsService.activateArticle(articleToActivate);
            showSnackbar('Article reactivated (PUBLISHED)', 'success');
            fetchArticles();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Activation failed';
            showSnackbar(msg, 'error');
        } finally {
            setShowActivateModal(false);
            setArticleToActivate(null);
        }
    };

    const openEditForm = (article = null) => {
        if (article) {
            navigate(`/cms/articles/edit/${article.section}/${article.slug}`);
        } else {
            navigate('/cms/articles/new');
        }
    };

    const handleNewArticleClick = () => {
        openEditForm();
    };

    // Permission Helpers
    const canCreate = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'CONTRIBUTOR'].includes(userRole);
    const canEdit = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'EDITOR'].includes(userRole);
    const canReview = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'PUBLISHER'].includes(userRole);
    const canPublish = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'].includes(userRole);
    const canDelete = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'].includes(userRole);

    const getDisplayDate = (article) => {
        const dateStr = article.published_at || article.created_at;
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const filteredArticles = articles.filter(article => {
        const matchesDate = filterDate ? new Date(article.published_at || article.created_at).toISOString().split('T')[0] === filterDate : true;

        if (activeTab === 'FEATURED') {
            return matchesDate && article.features && article.features.length > 0;
        }

        const matchesStatus = article.status === activeTab;
        return matchesDate && matchesStatus;
    });

    const statusCounts = {
        PUBLISHED: articles.filter(a => a.status === 'PUBLISHED').length,
        DRAFT: articles.filter(a => a.status === 'DRAFT').length,
        REVIEW: articles.filter(a => a.status === 'REVIEW').length,
        INACTIVE: articles.filter(a => a.status === 'INACTIVE').length,
        FEATURED: articles.filter(a => a.features && a.features.length > 0).length
    };

    return (
        <div className="section-fade-in">
            {/* Header */}
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-newspaper"></i>
                        Article Management
                    </h1>
                    <p className="am-subtitle">Manage news stories, academic updates, and categorized content.</p>
                </div>
                {canCreate && (
                    <button className="m-btn-primary" onClick={handleNewArticleClick}>
                        <i className="fas fa-plus"></i> New Article
                    </button>
                )}
            </div>

            {/* Filter Bar: Tabs + Search */}
            <div className="am-filter-bar">
                <div className="am-tabs">
                    {['PUBLISHED', 'DRAFT', 'REVIEW', 'INACTIVE', 'FEATURED'].map(status => (
                        <button
                            key={status}
                            className={`am-tab ${activeTab === status ? 'active' : ''} ${status === 'FEATURED' ? 'featured' : ''}`}
                            onClick={() => setActiveTab(status)}
                        >
                            {status === 'DRAFT' && <i className="fas fa-file-alt"></i>}
                            {status === 'REVIEW' && <i className="fas fa-search-plus"></i>}
                            {status === 'PUBLISHED' && <i className="fas fa-check-circle"></i>}
                            {status === 'INACTIVE' && <i className="fas fa-eye-slash"></i>}
                            {status === 'FEATURED' && <i className="fas fa-thumbtack"></i>}
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                            <span style={{
                                background: 'rgba(0,0,0,0.06)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7em',
                                marginLeft: '4px'
                            }}>
                                {statusCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="am-search-form">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', height: '46px', width: '100%' }}>
                        <div className="am-search-wrapper" style={{ flex: 1, height: '100%' }}> {/* flex: 1 to fill gap */}
                             <i className="fas fa-search am-search-icon"></i>
                             <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchArticles();
                                    }
                                }}
                                className="am-search-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); fetchArticles(); }}
                                    style={{
                                        border: 'none', background: 'transparent',
                                        color: '#94a3b8', cursor: 'pointer', padding: '0 8px'
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>

                        <LuxuryCalendar 
                            selectedDate={filterDate} 
                            onDateSelect={setFilterDate} 
                        />

                        {selectedIds.length > 0 && canDelete && (
                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="am-action-btn am-btn-delete"
                                style={{ width: 'auto', padding: '0 1rem', height: '100%', gap: '0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                                <i className="fas fa-trash-alt"></i> 
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="dashboard-section">
                {loading ? (
                    <div className="am-loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Fetching articles...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="am-empty-state">
                        <i className="fas fa-newspaper"></i>
                        <h3>No Articles Found</h3>
                        <p>Start by creating your first article draft.</p>
                    </div>
                ) : (
                    <div className="am-table-container">
                        <table className="am-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px', textAlign: 'center' }}>
                                        <div className="custom-checkbox">
                                            <input 
                                                type="checkbox" 
                                                id="selectAll"
                                                checked={filteredArticles.length > 0 && selectedIds.length === filteredArticles.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(filteredArticles.map(a => a.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                            <label htmlFor="selectAll"></label>
                                        </div>
                                    </th>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Section</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArticles.map(article => (
                                    <tr key={article.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="custom-checkbox">
                                                <input 
                                                    type="checkbox" 
                                                    id={`chk-${article.id}`}
                                                    checked={selectedIds.includes(article.id)}
                                                    onChange={() => {
                                                        if (selectedIds.includes(article.id)) {
                                                            setSelectedIds(selectedIds.filter(id => id !== article.id));
                                                        } else {
                                                            setSelectedIds([...selectedIds, article.id]);
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`chk-${article.id}`}></label>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--slate-500)' }}>#{article.id}</td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                                                {(() => {
                                                    const tr = article.translations?.find(t => t.language === (activeLanguage === 'telugu' ? 'te' : 'en')) || article.translations?.[0];
                                                    return tr?.title || article.title || 'Untitled Article';
                                                })()}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    <i className="fas fa-link" style={{ fontSize: '0.7rem' }}></i> {article.slug}
                                                </div>
                                                {article.features && article.features.length > 0 && article.features.map((feat, idx) => (
                                                    <span key={idx} style={{
                                                        fontSize: '0.65rem',
                                                        background: '#fff1f2',
                                                        color: '#e11d48',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: '700',
                                                        border: '1px solid #fecaca',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <i className="fas fa-thumbtack" style={{ fontSize: '0.6rem' }}></i> {feat.feature_type}
                                                        {feat.section && <span style={{ opacity: 0.7, fontWeight: '400' }}>({feat.section})</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                           {getDisplayDate(article)}
                                        </td>
                                        <td><span className="am-status-badge draft">{article.section}</span></td>
                                        <td>
                                            <span className={`am-status-badge ${article.status?.toLowerCase()}`}>
                                                {article.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="am-action-buttons">
                                                {canEdit && (
                                                    <LuxuryTooltip content="Edit / Translate">
                                                        <button className="am-action-btn am-btn-edit" onClick={() => openEditForm(article)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canReview && article.status === 'DRAFT' && (
                                                    <LuxuryTooltip content="Move to Review">
                                                        <button className="am-action-btn am-btn-edit" onClick={() => handleAction(article.id, 'review')}>
                                                            <i className="fas fa-file-export"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canPublish && (article.status === 'REVIEW' || article.status === 'DRAFT') && (
                                                    <LuxuryTooltip content="Publish Live">
                                                        <button className="am-action-btn am-btn-publish" onClick={() => handleAction(article.id, 'publish')}>
                                                            <i className="fas fa-paper-plane"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canPublish && article.status === 'PUBLISHED' && (
                                                    <LuxuryTooltip content={article.features?.length > 0 ? "Unpin Article" : "Pin Article"}>
                                                        <button 
                                                            className={`am-action-btn am-btn-pin ${article.features && article.features.length > 0 ? 'pinned' : ''}`}
                                                            onClick={() => handleAction(article.id, article.features?.length > 0 ? 'unpin' : 'feature')}
                                                        >
                                                            <i className="fas fa-thumbtack"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canPublish && (article.status !== 'INACTIVE') && (
                                                    <LuxuryTooltip content="Deactivate / Hide">
                                                        <button className="am-action-btn am-btn-delete" onClick={() => handleAction(article.id, 'deactivate')}>
                                                            <i className="fas fa-eye-slash"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canPublish && (article.status === 'INACTIVE') && (
                                                    <LuxuryTooltip content="Re-activate / Show">
                                                        <button className="am-action-btn am-btn-publish" onClick={() => handleAction(article.id, 'activate')}>
                                                            <i className="fas fa-redo"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                                {canDelete && (
                                                    <LuxuryTooltip content="Delete Permanently">
                                                        <button className="am-action-btn am-btn-delete" onClick={() => handleAction(article.id, 'delete')}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </LuxuryTooltip>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form and Modals would go here but now handled by dedicated page */}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div className="warning-icon-big">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h4 style={{ margin: '1rem 0' }}>Are you absolutely sure?</h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                This action is permanent and cannot be undone. This will remove the article and all its translations.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
                            <button className="btn-cancel-fancy" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={handleConfirmDelete}>Yes, Delete It</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivate Confirmation Modal */}
            {showDeactivateModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Deactivate Article</h3>
                            <button className="close-btn" onClick={() => setShowDeactivateModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div className="warning-icon-big" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <i className="fas fa-eye-slash"></i>
                            </div>
                            <h4 style={{ margin: '1rem 0' }}>Confirm Deactivation?</h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Do you really want to deactivate?
                            </p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
                            <button className="btn-cancel-fancy" onClick={() => setShowDeactivateModal(false)}>Keep Active</button>
                            <button className="btn-save-fancy" style={{ background: '#d97706', borderColor: '#b45309' }} onClick={handleConfirmDeactivate}>Yes, Deactivate</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activate Confirmation Modal */}
            {showActivateModal && (
                <div className="am-modal-overlay">
                    <div className="am-modal">
                        <div className="am-modal-header">
                            <h3>Confirm Reactivation</h3>
                            <button className="close-panel-btn" onClick={() => setShowActivateModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="am-modal-body">
                            <div className="am-warning-icon" style={{ background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-check" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            
                            <p style={{ color: '#0f172a', fontWeight: '500', marginBottom: '1.5rem' }}>
                                Are you sure you want to <strong>reactivate</strong> the following?
                            </p>

                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '700', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em' }}>
                                {articles.find(a => a.id === articleToActivate)?.title || 'Selected Article'}
                            </div>

                             <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0' }}>
                                This article will be republished and visible to users immediately.
                            </p>
                        </div>
                        <div className="am-modal-footer">
                            <button className="btn-reactivate" onClick={() => setShowActivateModal(false)}>Cancel</button>
                            <button className="btn-reactivate confirm" onClick={handleConfirmActivate}>Yes, Reactivate</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Feature Selection Modal */}
            {showFeatureModal && (
                <div className="modal-overlay-refined">
                    <div className="modal-card" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3><i className="fas fa-thumbtack"></i> Pin to Featured</h3>
                            <button className="close-btn" onClick={() => setShowFeatureModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div className="form-group-premium" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Feature Slot</label>
                                <CustomSelect
                                    value={featureData.feature_type}
                                    onChange={(val) => setFeatureData(prev => ({ ...prev, feature_type: val }))}
                                    options={['HERO', 'TOP', 'BREAKING', 'EDITOR_PICK']}
                                    placeholder="Select placement..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Section (Optional)</label>
                                    <CustomSelect
                                        value={featureData.section}
                                        onChange={(val) => setFeatureData(prev => ({ ...prev, section: val }))}
                                        options={['', ...sections.map(s => s.id)]}
                                        placeholder="Global Home"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>Rank (1 is top)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={featureData.rank}
                                        onChange={(e) => setFeatureData(prev => ({ ...prev, rank: parseInt(e.target.value) }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                                <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}>
                                    <i className="fas fa-info-circle"></i> This article will appear in the selected featured block on the website.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn-cancel-fancy" onClick={() => setShowFeatureModal(false)}>Cancel</button>
                            <button className="btn-save-fancy" style={{ background: '#ef4444', borderColor: '#b91c1c' }} onClick={handleFeatureSubmit}>Pin Article</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleManagement;
