import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import { newsService } from '../../../services';
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
    const [activeSection, setActiveSection] = useState('academics');
    const [parentFilter, setParentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState({}); // { id: isExpanded }
    const [childData, setChildData] = useState({}); // { parentId: [children] }

    const toggleExpand = async (category) => {
        const isExpanded = expandedRows[category.id];
        
        if (!isExpanded && !childData[category.id]) {
            setLoading(true);
            try {
                const children = await newsService.getCategoryChildren(activeSection, category.id);
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
    
    // Pagination state
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({
        name: '',
        slug: '',
        section: 'academics',
        parent_id: '',
        rank: 0,
        is_active: true
    });

    const sections = [
        { id: 'academics', name: 'Academics' },
        { id: 'jobs', name: 'Jobs' },
        { id: 'tech', name: 'Tech' },
        { id: 'business', name: 'Business' }
    ];

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    useEffect(() => {
        if (userRole) {
            if (viewMode === 'list') {
                fetchTaxonomy(activeSection, null, parentFilter, statusFilter);
            } else {
                fetchTree(activeSection);
            }
        }
    }, [activeSection, userRole, parentFilter, statusFilter, viewMode]);

    const fetchTree = async (section) => {
        setLoading(true);
        try {
            const data = await newsService.getTaxonomyTree(section);
            setTreeData(data);
        } catch (error) {
            showSnackbar('Failed to load hierarchy tree', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTaxonomy = async (section, cursor = null, parentId = '', active = '') => {
        setLoading(true);
        try {
            const params = { section };
            if (cursor) params.cursor = cursor;
            if (parentId) params.parent_id = parentId;
            if (active) params.active = active;

            const response = await newsService.getAdminCategories(params);
            
            if (cursor) {
                setTaxonomies(prev => [...prev, ...(response.results || [])]);
            } else {
                setTaxonomies(response.results || []);
            }
            
            setNextCursor(response.next_cursor);
            setHasNext(response.has_next);
        } catch (error) {
            showSnackbar('Failed to load taxonomy', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setIsEditing(true);
            setCurrentCategory({
                id: category.id,
                name: category.name,
                slug: category.slug,
                section: category.section,
                parent_id: category.parent_id || '',
                rank: category.rank || 0,
                is_active: category.is_active
            });
        } else {
            setIsEditing(false);
            setCurrentCategory({
                name: '',
                slug: '',
                section: activeSection,
                parent_id: '',
                rank: 0,
                is_active: true
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
            is_active: true
        });
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = { ...currentCategory };
            if (payload.parent_id === '') delete payload.parent_id;

            if (isEditing) {
                await newsService.updateCategory(payload.id, payload);
                showSnackbar('Category updated successfully', 'success');
            } else {
                await newsService.createCategory(payload);
                showSnackbar('Category created successfully', 'success');
            }
            handleCloseModal();
            if (viewMode === 'list') {
                fetchTaxonomy(activeSection, null, parentFilter, statusFilter);
            } else {
                fetchTree(activeSection);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to save category';
            showSnackbar(errorMsg, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category? This cannot be undone if there are no children.')) return;
        
        setActionLoading(true);
        try {
            await newsService.deleteCategory(id);
            showSnackbar('Category deleted successfully', 'success');
            if (viewMode === 'list') {
                fetchTaxonomy(activeSection, null, parentFilter, statusFilter);
            } else {
                fetchTree(activeSection);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to delete category (it might have children)';
            showSnackbar(errorMsg, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (category) => {
        setActionLoading(true);
        try {
            if (category.is_active) {
                await newsService.disableCategory(category.id);
                showSnackbar('Category disabled', 'info');
            } else {
                await newsService.enableCategory(category.id);
                showSnackbar('Category enabled', 'success');
            }
            
            if (viewMode === 'list') {
                fetchTaxonomy(activeSection, null, parentFilter, statusFilter);
            } else {
                fetchTree(activeSection);
            }
        } catch (error) {
            showSnackbar('Failed to update status', 'error');
        } finally {
            setActionLoading(false);
        }
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
        title: "Taxonomy Management",
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-tags"></i>
                        Taxonomy Management
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
                    {sections.map(section => (
                        <button 
                            key={section.id}
                            className={`am-tab ${activeSection === section.id ? 'active' : ''}`} 
                            onClick={() => {
                                setActiveSection(section.id);
                                setParentFilter('');
                            }}
                        >
                            {activeSection === section.id && <i className="fas fa-check-circle"></i>}
                            {section.name}
                        </button>
                    ))}
                </div>
                
                <div className="am-filter-controls" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select 
                        className="am-search-input" 
                        style={{ width: 'auto', paddingLeft: '1rem' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="true">Active Only</option>
                        <option value="false">Disabled Only</option>
                    </select>

                    {(parentFilter || statusFilter) && (
                        <button className="am-btn-secondary" onClick={() => { setParentFilter(''); setStatusFilter(''); }}>
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
                                        fetchTaxonomy(activeSection, null, parentFilter, statusFilter);
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
                            onToggleStatus={handleToggleStatus}
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
                                    <th>Status</th>
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
                                                            {item.parent_id ? (
                                                                <LuxuryTooltip content="Filter by this parent">
                                                                    <span 
                                                                        className="am-status-badge review" 
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setParentFilter(item.parent_id)}
                                                                    >
                                                                        PID: {item.parent_id}
                                                                    </span>
                                                                </LuxuryTooltip>
                                                            ) : (
                                                                <span className="am-status-badge draft">ROOT</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`am-status-badge ${item.is_active ? 'published' : 'draft'}`}>
                                                                {item.is_active ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </td>
                                                        <td className="am-actions-cell">
                                                            <LuxuryTooltip content="Edit Category">
                                                                <button className="am-action-btn edit" onClick={() => handleOpenModal(item)}>
                                                                   <i className="fas fa-edit"></i>
                                                                </button>
                                                            </LuxuryTooltip>
                                                            <LuxuryTooltip content={item.is_active ? "Disable Category" : "Enable Category"}>
                                                                <button 
                                                                    className={`am-action-btn ${item.is_active ? 'archive' : 'publish'}`}
                                                                    onClick={() => handleToggleStatus(item)}
                                                                >
                                                                    <i className={`fas fa-${item.is_active ? 'eye-slash' : 'eye'}`}></i>
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
                                        <td colSpan="6" className="am-empty-state">
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
                                    onClick={() => fetchTaxonomy(activeSection, nextCursor)}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load More'}
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
                                        value={currentCategory.section}
                                        disabled={isEditing}
                                        onChange={(e) => setCurrentCategory({...currentCategory, section: e.target.value})}
                                        required
                                    >
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
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
                                        onChange={(e) => setCurrentCategory({...currentCategory, parent_id: e.target.value})}
                                    >
                                        <option value="">ROOT (No Parent)</option>
                                        {taxonomies
                                            .filter(t => t.id !== currentCategory.id && !t.parent_id) 
                                            .map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                                            ))
                                        }
                                    </select>
                                </div>
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
                                    <div className="am-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                                        <label className="am-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={currentCategory.is_active}
                                                onChange={(e) => setCurrentCategory({...currentCategory, is_active: e.target.checked})}
                                            />
                                            <span className="am-slider"></span>
                                        </label>
                                        <span className="am-toggle-label" style={{ fontWeight: '600', color: 'var(--slate-700)' }}>
                                            {currentCategory.is_active ? 'Active' : 'Disabled'}
                                        </span>
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
