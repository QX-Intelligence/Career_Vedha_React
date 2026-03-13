import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
// import { newsService } from '../../../services'; // Replaced by hooks
import { 
    useTaxonomyList, 
    useTaxonomyTree, 
    useCreateCategory, 
    useUpdateCategory, 
    useDeleteCategory, 
    useToggleCategoryStatus,
    useFetchCategoryChildren,
    useSections 
} from '../../../hooks/useTaxonomy';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../../services/notificationService';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getRoleInitials } from '../../../utils/roleUtils';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import API_CONFIG from '../../../config/api.config';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import '../../../styles/ArticleManagement.css';
import './TaxonomyManagement.css';

import TaxonomyTreeView from '../components/TaxonomyTreeView';


const TaxonomyManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { role: userRole } = getUserContext();

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'
    const [isCmsOpen, setIsCmsOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [taxonomies, setTaxonomies] = useState([]);
    const [treeData, setTreeData] = useState([]);
    const [activeSection, setActiveSection] = useState('');
    const [parentFilter, setParentFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState({}); // { id: isExpanded }
    const [childData, setChildData] = useState({}); // { parentId: [children] }

    // Pagination state
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({
        name: '',
        slug: '',
        section: '',
        parent_id: '',
        rank: 0,
        content: '',
        image_id: null,
        pdf_id: null,
        isLevel4: false
    });

    const [isAddingNewSection, setIsAddingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    const { data: dynamicSections, isLoading: sectionsLoading } = useSections();
    const sections = dynamicSections || [];


    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    // State for cursor query
    const [currentCursor, setCurrentCursor] = useState(null);

    /* ================= DATA FETCHING ================= */
    const {
        data: taxonomyListResponse,
        isLoading: listLoading,
        error: listError
    } = useTaxonomyList(
        viewMode === 'list' ? {
            section: activeSection,
            cursor: currentCursor || undefined,
            parent_id: parentFilter || undefined
        } : { enabled: false }
    );

    // Tree View Data
    const {
        data: treeDataResponse,
        isLoading: treeLoading
    } = useTaxonomyTree(activeSection); // Allows caching for tree view

    // Children Fetcher
    const fetchChildrenFn = useFetchCategoryChildren();

    // Mutations
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    // Sync Data to State
    const [localTaxonomies, setLocalTaxonomies] = useState([]);
    
    // Derived state for loading
    const isLoading = (viewMode === 'list' ? listLoading : treeLoading) || sectionsLoading;


    // Update cursor when filtering changes
    useEffect(() => {
        setCurrentCursor(null);
        setTaxonomies([]); // Reset list on filter change
    }, [activeSection, parentFilter, viewMode]);

    // Handle initial active section from dynamic data
    useEffect(() => {
        if (sections.length > 0) {
            const currentSection = sections.find(s => (s.slug || s.id) === activeSection);
            if (!currentSection) {
                setActiveSection(sections[0].slug || sections[0].id);
            }
        }
    }, [sections, activeSection]);


    // Effect to Update Local State from Query
    useEffect(() => {
        if (viewMode === 'list' && taxonomyListResponse?.results) {
            setTaxonomies(prev => {
                // If we are at the beginning (no cursor in query or just reset)
                // But wait, `taxonomyListResponse` reflects the *latest* fetched page.
                // If I am appending, I need to keep previous.
                // If I am resetting, I need to clear.
                // How to distinguish?
                // `currentCursor` tells us if we requested a next page.
                 if (!currentCursor) {
                    return taxonomyListResponse.results;
                 }
                 // Avoid duplicates if React Query refetches existing data
                 const newItems = taxonomyListResponse.results;
                 const existingIds = new Set(prev.map(i => i.id));
                 const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
                 return [...prev, ...uniqueNewItems];
            });
            
            setNextCursor(taxonomyListResponse.next_cursor);
            setHasNext(taxonomyListResponse.has_next);
        }
    }, [taxonomyListResponse, currentCursor, viewMode]);

    // Update Tree Data
    useEffect(() => {
        if (viewMode === 'tree' && treeDataResponse) {
            setTreeData(treeDataResponse);
        }
    }, [treeDataResponse, viewMode]);

    const handleLoadMore = () => {
        if (hasNext && nextCursor) {
            setCurrentCursor(nextCursor);
        }
    };
    
    // Missing Handlers Re-implementation
    const handleOpenModal = (category = null) => {
        setIsAddingNewSection(false);
        setNewSectionName('');

        if (category) {
            setIsEditing(true);
            setCurrentCategory({
                id: category.id,
                name: category.name,
                slug: category.slug,
                section: category.section,
                parent_id: category.parent_id || '',
                rank: category.rank || 0,
                content: category.content || '',
                image_id: category.image_id || null,
                pdf_id: category.pdf_id || null,
                isLevel4: !!(category.content || category.image_id || category.pdf_id)
            });
        } else {
            setCurrentCategory({
                name: '',
                slug: '',
                section: activeSection,
                parent_id: '',
                rank: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory({
            name: '',
            slug: '',
            section: activeSection,
            parent_id: '',
            rank: 0,
            content: '',
            image_id: null,
            pdf_id: null,
            isLevel4: false
        });
    };




     /* ================= HANDLERS ================= */

    const handleDeleteCategory = (id) => {
        if (!window.confirm('Are you sure you want to delete this category? This cannot be undone if there are no children.')) return;
        
        deleteMutation.mutate(id, {
             onSuccess: () => showSnackbar('Category deleted successfully', 'success'),
             onError: (err) => showSnackbar(err.response?.data?.error || 'Failed to delete category', 'error')
        });
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        
        setActionLoading(true);
        try {
            let sectionValue = currentCategory.section; // This should be the ID
            
            // If section is a slug (from activeSection), convert to ID
            const sectionObj = sections.find(s => s.slug === sectionValue || s.id === sectionValue);
            if (sectionObj) {
                sectionValue = sectionObj.id;
            }

            if (isAddingNewSection && newSectionName.trim()) {
                const secPayload = {
                    name: newSectionName.trim(),
                    slug: newSectionName.trim().toLowerCase().replace(/\s+/g, '-'),
                    rank: 1
                };
                const newSec = await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS_CREATE, secPayload);
                sectionValue = newSec.data?.id || sectionValue;
            }

            const payload = { 
                section_id: sectionValue,
                name: currentCategory.name,
                slug: currentCategory.slug,
                parent_id: currentCategory.parent_id || null,
                rank: currentCategory.rank || 0
            };

            // Level 4 (Topic) additional fields
            if (currentCategory.isLevel4) {
                payload.content = currentCategory.content || '';
                payload.image_id = currentCategory.image_id || null;
                payload.pdf_id = currentCategory.pdf_id || null;
            }

            if (isEditing) {
                await djangoApi.patch(`taxonomy/categories/${currentCategory.id}/`, payload);
                showSnackbar('Category updated successfully', 'success');
            } else {
                await djangoApi.post(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_CATEGORIES_CREATE, payload);
                showSnackbar('Category created successfully', 'success');
            }
            handleCloseModal();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Failed to save category', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    
    // This function replaces the manual fetch for expansion
    const toggleExpand = async (category) => {
        const isExpanded = expandedRows[category.id];
        
        if (!isExpanded && !childData[category.id]) {
            setLoading(true); // Local loading state for visual feedback on row
            try {
                const children = await fetchChildrenFn(activeSection, category.id);
                setChildData(prev => ({ ...prev, [category.id]: children }));
            } catch (error) {
                showSnackbar('Failed to load children', 'error');
            } finally {
                setLoading(false);
            }
        }
        
        setExpandedRows(prev => ({
            ...prev,
            [category.id]: !isExpanded
        }));
    };

    const handleLogout = async () => {
        try {
            await api.post('/log-out');
            navigate('/admin-login');
        } catch (err) {
            navigate('/admin-login');
        }
    };

    const sidebarProps = {
        activeSection: 'taxonomy',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "Taxonomy Management (REFRESHED)",
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-tags"></i>
                        Taxonomy Management (REFRESHED)
                    </h1>
                    <p className="am-subtitle">Manage categories and tags across the platform</p>
                </div>
                <div className="am-actions">
                    <div className="am-view-toggle" style={{ display: 'inline-flex', marginRight: '1rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <button 
                            className="am-toggle-btn"
                            style={{ 
                                padding: '0.4rem 1rem', 
                                border: 'none', 
                                background: viewMode === 'list' ? 'white' : 'transparent', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                color: viewMode === 'list' ? '#fbbf24' : '#64748b',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setViewMode('list')}
                        >
                            <i className="fas fa-list"></i> List
                        </button>
                        <button 
                            className="am-toggle-btn"
                            style={{ 
                                padding: '0.4rem 1rem', 
                                border: 'none', 
                                background: viewMode === 'tree' ? 'white' : 'transparent', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                boxShadow: viewMode === 'tree' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                color: viewMode === 'tree' ? '#fbbf24' : '#64748b',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setViewMode('tree')}
                        >
                            <i className="fas fa-sitemap"></i> Tree
                        </button>
                    </div>
                    <button className="am-btn-primary" onClick={() => handleOpenModal()}>
                        <i className="fas fa-plus"></i> Add Category
                    </button>
                </div>
            </div>

            <div className="am-filter-bar">
                <div className="am-tabs">
                    {sections.map(section => {
                        const sectionKey = section.slug || section.id;
                        return (
                            <button 
                                key={section.id}
                                className={`am-tab ${activeSection === sectionKey ? 'active' : ''}`} 
                                onClick={() => {
                                    setActiveSection(sectionKey);
                                    setParentFilter('');
                                }}
                            >
                                {activeSection === sectionKey && <i className="fas fa-check-circle"></i>}
                                {section.name}
                            </button>
                        );
                    })}
                </div>
                
                <div className="am-filter-controls" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

                    {parentFilter && (
                        <button className="am-btn-secondary" onClick={() => setParentFilter('')}>
                            <i className="fas fa-times"></i> Clear Filters
                        </button>
                    )}

                    <div className="am-search-form" style={{ width: '250px' }}>
                        <div className="am-search-wrapper">
                            <i className="fas fa-search am-search-icon"></i>
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="am-search-input"
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase();
                                    if (!val) {
                                        // Just let the filtered taxonomies return to normal
                                        return;
                                    }
                                    setTaxonomies(prev => prev.filter(t => 
                                        t.name.toLowerCase().includes(val) || 
                                        t.slug.toLowerCase().includes(val)
                                    ));
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {parentFilter && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Filtering by Parent ID: <strong>#{parentFilter}</strong>
                    </span>
                    <button onClick={() => setParentFilter('')} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                        [Remove Filter]
                    </button>
                </div>
            )}

            <div className={`am-content ${viewMode === 'tree' ? 'tree-mode' : ''}`}>
                {loading && (taxonomies.length === 0 && treeData.length === 0) ? (
                    <div className="am-loading">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Fetching taxonomies...</p>
                    </div>
                ) : viewMode === 'tree' ? (
                    <div className="am-tree-wrapper" style={{ padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <TaxonomyTreeView 
                            data={treeData} 
                            onEdit={handleOpenModal}
                        />
                    </div>
                ) : (
                    <div className="am-table-container">
                        <table className="am-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Parent</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxonomies.length > 0 ? (
                                    taxonomies.map((tax) => {
                                        const renderRow = (item, level = 0) => {
                                            const isExpanded = expandedRows[item.id];
                                            const children = childData[item.id] || [];
                                            
                                            return (
                                                <React.Fragment key={item.id}>
                                                    <tr className={`${level > 0 ? 'am-row-child' : ''} ${isExpanded ? 'am-row-expanded' : ''}`}>
                                                        <td style={{ fontWeight: 'bold', color: 'var(--slate-500)', paddingLeft: level === 0 ? '1rem' : undefined }}>
                                                            {level === 0 ? (
                                                                <button 
                                                                    className={`am-expand-btn ${isExpanded ? 'active' : ''}`}
                                                                    onClick={() => toggleExpand(item)}
                                                                >
                                                                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                                                                </button>
                                                            ) : null}
                                                            #{item.id}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: level === 0 ? '700' : '600', color: level === 0 ? 'var(--slate-900)' : 'var(--slate-700)' }}>
                                                                {item.name}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                            <code>{item.slug}</code>
                                                        </td>
                                                        <td>
                                                            <LuxuryTooltip content={item.parent_id ? `Parent Category ID: ${item.parent_id}` : "Root Category"}>
                                                                {item.parent_id ? (
                                                                    <span 
                                                                        className="am-status-badge review" 
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setParentFilter(item.parent_id)}
                                                                    >
                                                                        PID: {item.parent_id}
                                                                    </span>
                                                                ) : (
                                                                    <span className="am-status-badge draft">ROOT</span>
                                                                )}
                                                            </LuxuryTooltip>
                                                        </td>
                                                        <td className="am-actions-cell">
                                                            <LuxuryTooltip content="Edit Category">
                                                                <button className="am-action-btn edit" onClick={() => handleOpenModal(item)}>
                                                                   <i className="fas fa-edit"></i>
                                                                </button>
                                                            </LuxuryTooltip>
                                                            {userRole === 'SUPER_ADMIN' && (
                                                                <LuxuryTooltip content="Delete Category">
                                                                    <button 
                                                                        className="am-action-btn delete" 
                                                                        onClick={() => handleDeleteCategory(item.id)}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </LuxuryTooltip>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {isExpanded && children.map(child => renderRow(child, level + 1))}
                                                </React.Fragment>
                                            );
                                        };

                                        // Only render root rows at the top level to avoid duplicates 
                                        // if the flat list contains children too.
                                        if (tax.parent_id && !parentFilter) return null;
                                        
                                        return renderRow(tax);
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="am-empty-state">
                                            <i className="fas fa-tags"></i>
                                            <h3>No taxonomy records found</h3>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {hasNext && (
                            <div className="am-pagination-trigger" style={{ textAlign: 'center', padding: '20px' }}>
                                <button 
                                    className="am-btn-secondary" 
                                    onClick={handleLoadMore}
                                    disabled={isLoading || listLoading}
                                >
                                    {isLoading || listLoading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="am-modal-overlay">
                    <div className="am-modal">
                        <div className="am-modal-header">
                            <h2>{isEditing ? 'Edit Category' : 'Create New Category'}</h2>
                            <button className="am-modal-close" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="am-modal-form">
                            <div className="am-modal-body">
                                <div className="am-form-group">
                                    <label className="am-label">Section</label>
                                    <select 
                                        className="am-input"
                                        value={isAddingNewSection ? 'NEW' : currentCategory.section}
                                        disabled={isEditing}
                                        onChange={(e) => {
                                            if (e.target.value === 'NEW') {
                                                setIsAddingNewSection(true);
                                            } else {
                                                setIsAddingNewSection(false);
                                                setCurrentCategory({...currentCategory, section: e.target.value});
                                            }
                                        }}
                                        required
                                    >
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        <option value="NEW">+ Other / New Section...</option>
                                    </select>
                                </div>
                                {isAddingNewSection && (
                                    <div className="am-form-group">
                                        <label className="am-label">New Section Name</label>
                                        <input 
                                            type="text"
                                            className="am-input"
                                            value={newSectionName}
                                            onChange={(e) => setNewSectionName(e.target.value)}
                                            placeholder="e.g. Career Tips"
                                            required
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            Section identifier will be: <code>{newSectionName.trim().toLowerCase().replace(/\s+/g, '_')}</code>
                                        </p>
                                    </div>
                                )}
                                <div className="am-form-group">
                                    <label className="am-label">Category Name</label>
                                    <input 
                                        type="text"
                                        className="am-input"
                                        value={currentCategory.name}
                                        onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                                        required
                                        placeholder="Category Name"
                                    />
                                </div>
                                <div className="am-form-group">
                                    <label className="am-label">Slug</label>
                                    <input 
                                        type="text"
                                        className="am-input"
                                        value={currentCategory.slug}
                                        onChange={(e) => setCurrentCategory({...currentCategory, slug: e.target.value})}
                                        required
                                        placeholder="category-slug"
                                    />
                                </div>
                                <div className="am-form-group">
                                    <label className="am-label">Parent Category</label>
                                    <select 
                                        className="am-input"
                                        value={currentCategory.parent_id || ''}
                                        onChange={(e) => {
                                            const parentId = e.target.value;
                                            // Depth check (simplified: if parent exists, it's at least level 2)
                                            // For true depth, we'd need to trace. 
                                            // Let's assume selecting a level 3 parent makes this level 4.
                                            setCurrentCategory({...currentCategory, parent_id: parentId});
                                        }}
                                    >
                                        <option value="">ROOT (No Parent)</option>
                                        {/* Ideally we should show the full tree as options or use a cascading select here too */}
                                        {taxonomies
                                            .filter(t => t.id !== currentCategory.id) 
                                            .map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="am-form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="isLevel4" 
                                        checked={currentCategory.isLevel4}
                                        onChange={(e) => setCurrentCategory({...currentCategory, isLevel4: e.target.checked})}
                                    />
                                    <label htmlFor="isLevel4" className="am-label" style={{ marginBottom: 0 }}>Is Level 4 (Topic)?</label>
                                </div>

                                {currentCategory.isLevel4 && (
                                    <div className="am-level4-fields" style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>Topic Specific Content</h4>
                                        <div className="am-form-group">
                                            <label className="am-label">Content (HTML)</label>
                                            <textarea 
                                                className="am-input"
                                                value={currentCategory.content}
                                                onChange={(e) => setCurrentCategory({...currentCategory, content: e.target.value})}
                                                placeholder="Enter HTML content..."
                                                rows="5"
                                            />
                                        </div>
                                        <div className="am-form-row">
                                            <div className="am-form-group">
                                                <label className="am-label">Image ID</label>
                                                <input 
                                                    type="number"
                                                    className="am-input"
                                                    value={currentCategory.image_id || ''}
                                                    onChange={(e) => setCurrentCategory({...currentCategory, image_id: e.target.value})}
                                                    placeholder="Media ID"
                                                />
                                            </div>
                                            <div className="am-form-group">
                                                <label className="am-label">PDF ID</label>
                                                <input 
                                                    type="number"
                                                    className="am-input"
                                                    value={currentCategory.pdf_id || ''}
                                                    onChange={(e) => setCurrentCategory({...currentCategory, pdf_id: e.target.value})}
                                                    placeholder="Media ID"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="am-form-row">
                                    <div className="am-form-group">
                                        <label className="am-label">Rank / Order</label>
                                        <input 
                                            type="number"
                                            className="am-input"
                                            value={currentCategory.rank}
                                            onChange={(e) => setCurrentCategory({...currentCategory, rank: e.target.value})}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="am-modal-footer">
                                <button type="button" className="am-btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="am-btn-primary" disabled={actionLoading}>
                                    {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : (isEditing ? 'Save Changes' : 'Create Category')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default TaxonomyManagement;
