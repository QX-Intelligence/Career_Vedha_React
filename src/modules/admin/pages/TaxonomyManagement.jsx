import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import api, { getUserContext, subscribeToAuthChanges } from '../../../services/api';
import djangoApi from '../../../services/djangoApi';
// import { newsService } from '../../../services'; // Replaced by hooks
import { 
    useTaxonomyList, 
    useTaxonomyTree, 
    useTaxonomyLevels,
    useCreateCategory, 
    useUpdateCategory, 
    useDeleteCategory, 
    useToggleCategoryStatus,
    useFetchCategoryChildren,
    useCategoryChildren,
    useCategoriesBySection,
    useSections,
    useCreateSection,
    useUpdateSection,
    useDeleteSection
} from '../../../hooks/useTaxonomy';
import { fetchNotifications, markAsSeen, markAllAsSeen, approveRequest, rejectRequest } from '../../../services/notificationService';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getRoleInitials } from '../../../utils/roleUtils';
import Skeleton, { SkeletonTable } from '../../../components/ui/Skeleton';
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
    const [activeTab, setActiveTab] = useState('taxonomy'); // 'taxonomy' or 'sections'
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
    const [modalMode, setModalMode] = useState('CATEGORY'); // 'SECTION', 'CATEGORY', 'SUB_CATEGORY', 'SEGMENT', 'TOPIC'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Section specific state
    const [sectionSearchQuery, setSectionSearchQuery] = useState('');
    const [currentSection, setCurrentSection] = useState({
        id: null,
        name: '',
        slug: '',
        rank: 0,
        is_active: true
    });

    const [currentCategory, setCurrentCategory] = useState({
        id: null,
        name: '',
        slug: '',
        section: '',
        parent_id: '',
        rank: 0,
        content: '',
        is_active: true,
        isLevel4: false
    });

    const [isAddingNewSection, setIsAddingNewSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    // Cascading selection state for parent
    const [selLevel2, setSelLevel2] = useState(''); // Category (Root)
    const [selLevel3, setSelLevel3] = useState(''); // Sub-Category
    const [selLevel4, setSelLevel4] = useState(''); // Segment
    // Level 5 (Topic) is the one usually being created or its parent is Level 4

    const { data: dynamicSections, isLoading: sectionsLoading } = useSections(true);
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
        isFetching: listFetching,
        error: listError
    } = useTaxonomyList(
        {
            section: activeSection,
            cursor: currentCursor || undefined,
            parent_id: parentFilter || undefined
        },
        { enabled: false } // Disabled as we're switching to tree-based list
    );

    const {
        data: levelsDataResponse,
        isLoading: levelsLoading,
        isFetching: levelsFetching
    } = useTaxonomyLevels(activeSection, { 
        enabled: !!activeSection && viewMode === 'list' 
    });

    const {
        data: treeDataResponse,
        isLoading: treeLoading,
        isFetching: treeFetching
    } = useTaxonomyTree(activeSection, { 
        enabled: !!activeSection && viewMode === 'tree'
    });

    // Children Fetcher
    const fetchChildrenFn = useFetchCategoryChildren();

    // Mutations
    // Resolve modal section context (ID or Slug) reliably
    const modalSectionSlug = useMemo(() => {
        if (!Array.isArray(sections) || sections.length === 0) return activeSection;
        const currentIdOrSlug = currentCategory.section || activeSection;
        const sectionObj = sections.find(s => 
            String(s.id) === String(currentIdOrSlug) || 
            String(s.slug) === String(currentIdOrSlug)
        );
        return sectionObj?.slug || (typeof currentIdOrSlug === 'string' ? currentIdOrSlug : activeSection);
    }, [sections, currentCategory.section, activeSection]);

    // Cascading child hooks (using resolved slug)
    const { data: catLevel2Data, isLoading: catL2Loading } = useCategoriesBySection(modalSectionSlug);
    const { data: catLevel3Data } = useCategoryChildren(modalSectionSlug, selLevel2 || null);
    const { data: catLevel4Data } = useCategoryChildren(modalSectionSlug, selLevel3 || null);
    const { data: catLevel5Data } = useCategoryChildren(modalSectionSlug, selLevel4 || null);

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const createSectionMutation = useCreateSection();
    const updateSectionMutation = useUpdateSection();
    const deleteSectionMutation = useDeleteSection();

    // Sync Data to State
    const [localTaxonomies, setLocalTaxonomies] = useState([]);
    
    // Memoized flat list for list view
    const flatLevelsData = useMemo(() => {
        // Now returns the nested array directly
        return Array.isArray(levelsDataResponse) ? levelsDataResponse : [];
    }, [levelsDataResponse]);

    // Derived state for loading
    const isLoading = (viewMode === 'list' ? (levelsLoading || levelsFetching) : (treeLoading || treeFetching)) || sectionsLoading;


    // Update cursor when filtering changes
    useEffect(() => {
        setCurrentCursor(null);
        setTaxonomies([]); // Reset list on filter change
    }, [activeSection, parentFilter, viewMode]);

    // Handle initial active section from dynamic data
    useEffect(() => {
        if (sections.length > 0 && activeTab === 'taxonomy') {
            const currentSection = sections.find(s => (s.slug || s.id) === activeSection);
            if (!currentSection) {
                setActiveSection(sections[0].slug || sections[0].id);
            }
        }
    }, [sections, activeSection, activeTab]);


    // Effect to Update Local State from Queries
    useEffect(() => {
        if (viewMode === 'list') {
            setTaxonomies(flatLevelsData);
        } else if (viewMode === 'tree' && treeDataResponse) {
            setTaxonomies(treeDataResponse);
        }
    }, [flatLevelsData, treeDataResponse, viewMode]);

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
    
    // Unified Modal Handler
    const handleOpenModal = (mode = 'CATEGORY', data = null, predefinedParent = null, depth = 0) => {
        if (mode === 'DELETE_CAT') {
            handleDeleteCategory(predefinedParent.id);
            return;
        }
        setModalMode(mode);
        setIsEditing(false);
        
        if (mode === 'SECTION') {
            if (data) {
                setIsEditing(true);
                setCurrentSection({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    rank: data.rank || 0,
                    is_active: data.is_active ?? true
                });
            } else {
                setCurrentSection({
                    id: null,
                    name: '',
                    slug: '',
                    rank: sections.length > 0 ? Math.max(...sections.map(s => s.rank || 0)) + 1 : 0,
                    is_active: true
                });
            }
        } else {
            // Reset hierarchy selection
            setSelLevel2('');
            setSelLevel3('');
            setSelLevel4('');

            if (data) {
                setIsEditing(true);
                
                // Robustly resolve section ID from either section_id or section slug
                const sectionObj = Array.isArray(sections) 
                    ? sections.find(s => String(s.id) === String(data.section_id || data.section) || String(s.slug) === String(data.section_id || data.section))
                    : null;
                
                const targetSection = data.section_id || data.section || activeSection;
                const resolvedSectionId = sectionObj ? parseInt(sectionObj.id, 10) : (parseInt(targetSection, 10) || targetSection);

                setCurrentCategory({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    section: resolvedSectionId,
                    parent_id: data.parent_id || '',
                    rank: data.rank || 0,
                    content: data.content || '',
                    is_active: data.is_active !== undefined ? data.is_active : true,
                    isLevel4: !!data.content
                });
                
                // Set modal mode and populate hierarchy based on depth
                if (depth === 0) {
                    setModalMode('CATEGORY');
                } else if (depth === 1) {
                    setModalMode('SUB_CATEGORY');
                    setSelLevel2(data.parent_id || '');
                } else if (depth === 2) {
                    setModalMode('SEGMENT');
                    setSelLevel3(data.parent_id || '');
                    // Note: selLevel2 (grandparent) might be missing but is locked/disabled during edit
                } else if (depth >= 3 || mode === 'TOPIC') {
                    setModalMode('TOPIC');
                    setSelLevel4(data.parent_id || '');
                } else {
                    // Fallback detection
                    if (!data.parent_id) {
                        setModalMode('CATEGORY');
                    } else if (data.content || depth >= 3) {
                        setModalMode('TOPIC');
                    } else {
                        setModalMode('SUB_CATEGORY');
                        setSelLevel2(data.parent_id);
                    }
                }
            } else {
                const activeSectionObj = Array.isArray(sections) 
                    ? sections.find(s => String(s.slug) === String(activeSection) || String(s.id) === String(activeSection))
                    : null;
                
                let initialSection = activeSectionObj ? parseInt(activeSectionObj.id, 10) : '';

                if (predefinedParent) {
                    initialSection = predefinedParent.section_id || predefinedParent.section;
                    if (depth === 0) {
                        setModalMode('SUB_CATEGORY');
                        setSelLevel2(predefinedParent.id);
                    } else if (depth === 1) {
                        setModalMode('SEGMENT');
                        setSelLevel3(predefinedParent.id);
                        setSelLevel2(predefinedParent.parent_id);
                    } else if (depth === 2) {
                        setModalMode('TOPIC');
                        setSelLevel4(predefinedParent.id);
                        setSelLevel3(predefinedParent.parent_id);
                    }
                }

                setCurrentCategory({
                    name: '',
                    slug: '',
                    section: initialSection,
                    parent_id: '',
                    rank: 0,
                    content: '',
                    is_active: true,
                    isLevel4: mode === 'TOPIC' || !!predefinedParent
                });
            }
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (modalMode === 'SECTION') {
            setCurrentSection({ id: null, name: '', slug: '', rank: 0, is_active: true });
        } else {
            setCurrentCategory({
                name: '',
                slug: '',
                section: activeSection,
                parent_id: '',
                rank: 0,
                content: '',
                isLevel4: false
            });
        }
    };




     /* ================= HANDLERS ================= */

    const handleDeleteCategory = (id) => {
        if (!window.confirm('Are you sure you want to delete this category? This cannot be undone if there are no children.')) return;
        
        deleteMutation.mutate(id, {
             onSuccess: () => showSnackbar('Category deleted successfully', 'success'),
             onError: (err) => showSnackbar(err.response?.data?.error || 'Failed to delete category', 'error')
        });
    };

    const handleDeleteSection = (id) => {
        if (!window.confirm('Are you sure you want to delete this section? It will only work if it has no categories.')) return;
        
        deleteSectionMutation.mutate(id, {
             onSuccess: () => showSnackbar('Section deleted successfully', 'success'),
             onError: (err) => showSnackbar(err.response?.data?.error || 'Failed to delete section', 'error')
        });
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (modalMode === 'SECTION') {
                const secPayload = {
                    name: currentSection.name,
                    slug: currentSection.slug,
                    rank: parseInt(currentSection.rank || 0, 10),
                    is_active: currentSection.is_active
                };
                if (isEditing) {
                    await updateSectionMutation.mutateAsync({ id: currentSection.id, data: secPayload });
                    showSnackbar('Section updated successfully', 'success');
                } else {
                    await createSectionMutation.mutateAsync(secPayload);
                    showSnackbar('Section created successfully', 'success');
                }
                handleCloseModal();
                return;
            }
            // Section creation moved to SectionManagement.jsx

            // 2. Resolve section_id (must be integer)
            let rawSection = currentCategory.section;
            let sectionId = parseInt(rawSection, 10);

            // If direct parse fails, try searching in the sections list using slug or raw ID
            if (isNaN(sectionId) || !rawSection) {
                const searchTarget = rawSection || activeSection;
                const sectionObj = Array.isArray(sections)
                    ? sections.find(s => 
                        String(s.slug) === String(searchTarget) || 
                        String(s.id) === String(searchTarget)
                    )
                    : null;
                if (sectionObj) {
                    sectionId = parseInt(sectionObj.id, 10);
                }
            }

            if (sectionId === null || sectionId === undefined || isNaN(sectionId)) {
                console.error('[TaxonomyManagement] Validation Failed: sectionId is invalid', { rawSection, activeSection, sectionId });
                showSnackbar('Please select a valid section', 'error');
                setActionLoading(false);
                return;
            }

            // 3. Resolve Parent ID from cascading selection
            let resolvedParentId = null;
            if (modalMode === 'SUB_CATEGORY') {
                resolvedParentId = selLevel2;
            } else if (modalMode === 'SEGMENT') {
                resolvedParentId = selLevel3 || selLevel2;
            } else if (modalMode === 'TOPIC') {
                resolvedParentId = selLevel4 || selLevel3 || selLevel2;
            }

            const finalParentId = resolvedParentId ? parseInt(resolvedParentId, 10) : 
                                 (isEditing ? (currentCategory.parent_id ? parseInt(currentCategory.parent_id, 10) : null) : null);

            // Construct payload dynamically
            const payload = {
                name: currentCategory.name,
                slug: currentCategory.slug,
                rank: parseInt(currentCategory.rank || 0, 10),
                is_active: currentCategory.is_active
            };

            // Only include hierarchy fields when CREATING a new category
            // During EDIT, omitting them ensures the backend (PATCH) preserves existing database values
            if (!isEditing) {
                payload.section_id = sectionId;
                payload.parent_id = finalParentId;
            }

            // HTML content for topics
            if (currentCategory.isLevel4 || modalMode === 'TOPIC') {
                payload.content = currentCategory.content || '';
            }

            if (isEditing) {
                await updateMutation.mutateAsync({ id: currentCategory.id, data: payload });
                showSnackbar('Category updated successfully', 'success');
                handleCloseModal();
            } else {
                await createMutation.mutateAsync(payload);
                showSnackbar('Category created successfully', 'success');
                handleCloseModal();
            }
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Failed to save category', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    
    // This function replaces the manual fetch for expansion
    const toggleExpand = async (category, level = 0) => {
        const isExpanded = expandedRows[category.id];
        
        // Define possible child keys
        const childKeys = ['sub_categories', 'segments', 'topics', 'children'];
        const childKey = childKeys[level] || 'children';
        const hasPreloadedChildren = category[childKey] && category[childKey].length > 0;

        // Only fetch if children are not already in the tree node OR childData
        if (!isExpanded && !hasPreloadedChildren && !childData[category.id]) {
            setLoading(true);
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
            <div className="am-header redesigned">
                <div className="am-header-left">
                    <div className="am-title-icon-wrapper">
                        <i className={`fas ${activeTab === 'sections' ? 'fa-layer-group' : 'fa-tags'}`}></i>
                    </div>
                    <div className="am-title-content">
                        <h1 className="am-title">
                            {activeTab === 'sections' ? 'Section Management' : 'Taxonomy Management'}
                        </h1>
                        <p className="am-subtitle">
                            {activeTab === 'sections' ? 'Manage root-level content divisions' : 'Manage categories and tags across the platform'}
                        </p>
                    </div>
                </div>
                
                <div className="am-header-right">
                    <div className="am-tabs-switcher premium">
                        <button 
                            className={`tab-btn ${activeTab === 'taxonomy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('taxonomy')}
                        >
                            <i className="fas fa-sitemap"></i> Taxonomy
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sections')}
                        >
                            <i className="fas fa-layer-group"></i> Sections
                        </button>
                    </div>

                    <div className="am-actions-group">
                        {activeTab === 'taxonomy' ? (
                            <div className="am-view-toggle">
                                <button 
                                    className={`am-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <i className="fas fa-list"></i>
                                </button>
                                <button 
                                    className={`am-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
                                    onClick={() => setViewMode('tree')}
                                    title="Hierarchy Tree"
                                >
                                    <i className="fas fa-sitemap"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="am-multi-actions redesigned">
                                <button className="am-btn-l0" onClick={() => handleOpenModal('SECTION')}>
                                    <i className="fas fa-folder-plus"></i> Section (L0)
                                </button>
                                <button className="am-btn-l1" onClick={() => handleOpenModal('CATEGORY')}>
                                    <i className="fas fa-tag"></i> Category (L1)
                                </button>
                                <button className="am-btn-l2" onClick={() => handleOpenModal('SUB_CATEGORY')}>
                                    <i className="fas fa-layer-group"></i> Sub (L2)
                                </button>
                                <button className="am-btn-l3" onClick={() => handleOpenModal('SEGMENT')}>
                                    <i className="fas fa-project-diagram"></i> Seg (L3)
                                </button>
                                <button className="am-btn-l4" onClick={() => handleOpenModal('TOPIC')}>
                                    <i className="fas fa-leaf"></i> Topic (L4)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeTab === 'taxonomy' ? (
                <>
                    <div className="am-filter-bar">
                        <div className="am-tabs slim-scrollbar">
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
                                        {section.name}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="am-filter-controls">
                            <div className="am-search-form">
                                <div className="am-search-wrapper">
                                    <i className="fas fa-search am-search-icon"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Search Categories..." 
                                        className="am-search-input"
                                        onChange={(e) => {
                                            const val = e.target.value.toLowerCase();
                                            setSearchQuery(val);
                                            const sourceData = viewMode === 'list' ? flatLevelsData : treeDataResponse;
                                            
                                            if (!val || !sourceData) {
                                                setTaxonomies(sourceData || []);
                                                return;
                                            }

                                            // Recursive filter and auto-expand for nested hierarchy
                                            const filterHierarchy = (items, query, depth = 0) => {
                                                const newExpandedRows = {};
                                                const filteredItems = items.map(item => {
                                                    const isMatch = item.name.toLowerCase().includes(query) || 
                                                                   item.slug.toLowerCase().includes(query);
                                                    
                                                    const childKeys = ['sub_categories', 'segments', 'topics', 'children'];
                                                    let childrenMatches = {};
                                                    let hasChildMatch = false;

                                                    for (const key of childKeys) {
                                                        if (item[key] && Array.isArray(item[key])) {
                                                            const { filtered: f, expanded: e } = filterHierarchy(item[key], query, depth + 1);
                                                            if (f.length > 0) {
                                                                childrenMatches[key] = f;
                                                                Object.assign(newExpandedRows, e);
                                                                hasChildMatch = true;
                                                            }
                                                        }
                                                    }

                                                    if (isMatch || hasChildMatch) {
                                                        if (hasChildMatch) {
                                                            newExpandedRows[item.id] = true;
                                                        }
                                                        const result = { ...item, ...childrenMatches };
                                                        return result;
                                                    }
                                                    return null;
                                                }).filter(Boolean);
                                                
                                                return { filtered: filteredItems, expanded: newExpandedRows };
                                            };

                                            const { filtered, expanded } = filterHierarchy(sourceData, val);
                                            setTaxonomies(filtered);
                                            setExpandedRows(prev => ({ ...prev, ...expanded }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`am-content ${viewMode === 'tree' ? 'tree-mode' : ''}`}>
                        {(isLoading || loading) && (taxonomies.length === 0 && treeData.length === 0) ? (
                            <SkeletonTable rows={10} />
                        ) : viewMode === 'tree' ? (
                            <div className="am-tree-wrapper">
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
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxonomies.length > 0 ? (
                                            taxonomies.filter(tax => searchQuery ? true : !tax.parent_id).map((tax) => {
                                                const renderRow = (item, level = 0) => {
                                                    const isExpanded = expandedRows[item.id];
                                                    
                                                    // Get current children from nested data or childData map
                                                    const childKeys = ['sub_categories', 'segments', 'topics', 'children'];
                                                    const childKey = childKeys[level] || 'children';
                                                    const children = item[childKey] || childData[item.id] || [];
                                                    const hasChildren = children.length > 0;
                                                    
                                                    return (
                                                        <React.Fragment key={`row-${item.id}-${level}`}>
                                                            <tr className={`${level > 0 ? 'am-row-child' : ''} ${isExpanded ? 'am-row-expanded' : ''}`}>
                                                                 <td 
                                                                    style={{ 
                                                                        fontWeight: 'bold', 
                                                                        color: 'var(--slate-500)', 
                                                                        paddingLeft: `${level * 2 + 1}rem`,
                                                                        '--level': level
                                                                    }}
                                                                >
                                                                    {hasChildren ? (
                                                                        <button 
                                                                            className={`am-expand-btn ${isExpanded ? 'active' : ''}`}
                                                                            onClick={() => toggleExpand(item, level)}
                                                                        >
                                                                            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                                                                        </button>
                                                                    ) : (
                                                                        <span style={{ display: 'inline-block', width: '28px', marginRight: '0.75rem' }}></span>
                                                                    )}
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
                                                                <td className="am-actions-cell">
                                                                    <div className="am-action-group">
                                                                        <LuxuryTooltip content={`Add ${level === 0 ? 'Sub-Category' : level === 1 ? 'Segment' : 'Topic'}`}>
                                                                            <button className="am-action-btn add" onClick={() => {
                                                                                const targetMode = level === 0 ? 'SUB_CATEGORY' : level === 1 ? 'SEGMENT' : 'TOPIC';
                                                                                handleOpenModal(targetMode, null, item, level);
                                                                            }}>
                                                                                <i className="fas fa-plus-circle"></i>
                                                                            </button>
                                                                        </LuxuryTooltip>
                                                                        <LuxuryTooltip content="Edit Item">
                                                                            <button className="am-action-btn edit" onClick={() => {
                                                                                let editMode = 'CATEGORY';
                                                                                if (item.content) editMode = 'TOPIC';
                                                                                else if (level === 1) editMode = 'SUB_CATEGORY';
                                                                                else if (level === 2) editMode = 'SEGMENT';
                                                                                else if (level === 3) editMode = 'TOPIC';
                                                                                handleOpenModal(editMode, item, null, level);
                                                                            }}>
                                                                                <i className="fas fa-edit"></i>
                                                                            </button>
                                                                        </LuxuryTooltip>
                                                                        {userRole === 'SUPER_ADMIN' && (
                                                                            <LuxuryTooltip content="Delete Item">
                                                                                <button 
                                                                                    className="am-action-btn delete" 
                                                                                    onClick={() => handleDeleteCategory(item.id)}
                                                                                >
                                                                                    <i className="fas fa-trash"></i>
                                                                                </button>
                                                                            </LuxuryTooltip>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && children.map(child => renderRow(child, level + 1))}
                                                        </React.Fragment>
                                                    );
                                                };
                                                if (parentFilter && tax.id !== parseInt(parentFilter)) return null;
                                                return renderRow(tax);
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="am-empty-state">
                                                    <i className="fas fa-tags"></i>
                                                    <h3>No taxonomy records found</h3>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="am-content sections-tab">
                    {sectionsLoading && sections.length === 0 ? (
                        <SkeletonTable rows={8} />
                    ) : (
                        <>
                            <div className="am-filter-bar">
                                <div className="am-search-form" style={{ width: '400px' }}>
                                    <div className="am-search-wrapper">
                                        <i className="fas fa-search am-search-icon"></i>
                                        <input 
                                            type="text" 
                                            placeholder="Search sections..." 
                                            className="am-search-input"
                                            value={sectionSearchQuery}
                                            onChange={(e) => setSectionSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="am-table-container">
                                <table className="am-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Slug</th>
                                            <th>Rank</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sections.filter(s => s.name.toLowerCase().includes(sectionSearchQuery.toLowerCase())).map(section => (
                                            <tr key={section.id}>
                                                <td style={{ fontWeight: 'bold' }}>#{section.id}</td>
                                                <td style={{ fontWeight: '600' }}>{section.name}</td>
                                                <td><code>{section.slug}</code></td>
                                                <td>{section.rank}</td>
                                                <td>
                                                    <span className={`am-status-badge ${section.is_active ? 'active' : 'inactive'}`}>
                                                        {section.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="am-actions-cell">
                                                    <div className="am-action-group">
                                                        <button className="am-action-btn edit" onClick={() => handleOpenModal('SECTION', section)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        {userRole === 'SUPER_ADMIN' && (
                                                            <button className="am-action-btn delete" onClick={() => handleDeleteSection(section.id)}>
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* CREATE/EDIT MODAL - 5 LEVEL HIERARCHY */}
            {isModalOpen && (
                <div className="am-modal-overlay">
                    <div className="am-modal premium-modal">
                        <div className="am-modal-header">
                            <div className="modal-title-wrapper">
                                <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus-circle'} modal-title-icon`}></i>
                                <div>
                                    <h2>
                                        {isEditing ? 'Edit' : 'Create New'} {
                                            modalMode === 'SECTION' ? 'Section (L0)' :
                                            modalMode === 'CATEGORY' ? 'Category (L1)' : 
                                            modalMode === 'SUB_CATEGORY' ? 'Sub-Category (L2)' : 
                                            modalMode === 'SEGMENT' ? 'Segment (L3)' : 
                                            'Topic (L4)'
                                        }
                                    </h2>
                                    <p className="modal-subtitle">
                                        {modalMode === 'SECTION' ? 'Create a top-level academic section' :
                                         modalMode === 'CATEGORY' ? 'Create a primary classification under a Section' :
                                         modalMode === 'SUB_CATEGORY' ? 'Create a secondary grouping under a Category' :
                                         modalMode === 'SEGMENT' ? 'Narrow down subjects within Sub-Categories' :
                                         'Add specific actionable topics with content'}
                                    </p>
                                </div>
                            </div>
                            <button className="am-modal-close" onClick={handleCloseModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveCategory} className="am-modal-form">
                            <div className="am-modal-body slim-scrollbar">
                                {modalMode !== 'SECTION' && !isEditing && (
                                    <div className="form-section">
                                        <h3 className="section-title">Hierarchy Selection</h3>
                                        
                                        <div className="form-grid">
                                            <div className="am-form-group">
                                                <label className="am-label">Level 0 - Section</label>
                                                <div className="select-wrapper">
                                                    <select 
                                                        className="am-input"
                                                        value={currentCategory.section || (Array.isArray(sections) ? sections.find(s => String(s.slug) === String(activeSection) || String(s.id) === String(activeSection))?.id : activeSection)}
                                                        disabled={isEditing}
                                                        onChange={(e) => {
                                                            setCurrentCategory({...currentCategory, section: e.target.value});
                                                            setSelLevel2('');
                                                        }}
                                                        required
                                                    >
                                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    <i className="fas fa-chevron-down select-icon"></i>
                                                </div>
                                            </div>

                                            {(modalMode !== 'SECTION' && modalMode !== 'CATEGORY') && (
                                                <div className="am-form-group">
                                                    <label className="am-label">Level 1 - Category</label>
                                                    <div className="select-wrapper">
                                                        <select 
                                                            className="am-input"
                                                            value={selLevel2}
                                                            onChange={(e) => {
                                                                setSelLevel2(e.target.value);
                                                                setSelLevel3('');
                                                            }}
                                                            disabled={isEditing}
                                                            required
                                                        >
                                                            <option value="">Select Category</option>
                                                            {(catLevel2Data || []).map(cat => (
                                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                        <i className="fas fa-chevron-down select-icon"></i>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {(modalMode === 'SEGMENT' || modalMode === 'TOPIC') && (
                                            <>
                                                <div className="form-grid">
                                                    <div className="am-form-group">
                                                        <label className="am-label">Level 2 - Sub-Category</label>
                                                        <div className="select-wrapper">
                                                            <select 
                                                                className="am-input"
                                                                value={selLevel3}
                                                                onChange={(e) => {
                                                                    setSelLevel3(e.target.value);
                                                                    setSelLevel4('');
                                                                }}
                                                                disabled={isEditing || !selLevel2}
                                                                required
                                                            >
                                                                <option value="">Select Sub-Category</option>
                                                                {(catLevel3Data || []).map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                            <i className="fas fa-chevron-down select-icon"></i>
                                                        </div>
                                                    </div>

                                                    {modalMode === 'TOPIC' && (
                                                        <div className="am-form-group">
                                                            <label className="am-label">Level 3 - Segment</label>
                                                            <div className="select-wrapper">
                                                                <select 
                                                                    className="am-input"
                                                                    value={selLevel4}
                                                                    onChange={(e) => setSelLevel4(e.target.value)}
                                                                    disabled={isEditing || !selLevel3}
                                                                    required
                                                                >
                                                                    <option value="">Select Segment</option>
                                                                    {(catLevel4Data || []).map(cat => (
                                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                    ))}
                                                                </select>
                                                                <i className="fas fa-chevron-down select-icon"></i>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="form-hint" style={{ 
                                                    marginBottom: '1.5rem', 
                                                    padding: '1rem', 
                                                    background: '#fff9db', 
                                                    borderLeft: '4px solid #fab005',
                                                    color: '#856404',
                                                    borderRadius: '4px'
                                                }}>
                                                    <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i> 
                                                    <strong>Current Target: </strong>
                                                    {modalMode === 'TOPIC' ? "Topic (Level 4 Leaf)" : 
                                                     modalMode === 'SEGMENT' ? "Segment (Level 3)" : 
                                                     modalMode === 'SUB_CATEGORY' ? "Sub-Category (Level 2)" : 
                                                     "Root Category (Level 1)"}
                                                </div>

                                                {isEditing && (
                                                    <div className="form-hint" style={{ marginTop: '0.5rem', fontWeight: '600', color: '#10b981' }}>
                                                        <i className="fas fa-lock"></i> Parent hierarchy is locked during edit.
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="form-section">
                                    <h3 className="section-title" style={{ paddingLeft: 0 }}>
                                        {modalMode === 'SECTION' ? 'Section' : 'Category'} Details
                                    </h3>
                                    
                                    <div className="form-grid">
                                        <div className="am-form-group">
                                            <label className="am-label">Name</label>
                                                <div className="input-with-icon">
                                                <i className="fas fa-tag input-icon"></i>
                                                <input 
                                                    type="text"
                                                    value={modalMode === 'SECTION' ? currentSection.name : currentCategory.name}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                                        if (modalMode === 'SECTION') {
                                                            setCurrentSection({...currentSection, name: val, slug: currentSection.slug === '' ? slug : currentSection.slug});
                                                        } else {
                                                            setCurrentCategory({...currentCategory, name: val, slug: currentCategory.slug === '' ? slug : currentCategory.slug});
                                                        }
                                                    }}
                                                    required
                                                    placeholder="Enter name"
                                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '0.75rem 0', fontWeight: '600' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="am-form-group">
                                            <label className="am-label">Slug</label>
                                            <div className="input-with-icon">
                                                <i className="fas fa-link input-icon"></i>
                                                <input 
                                                    type="text"
                                                    value={modalMode === 'SECTION' ? currentSection.slug : currentCategory.slug}
                                                    onChange={(e) => {
                                                        if (modalMode === 'SECTION') setCurrentSection({...currentSection, slug: e.target.value});
                                                        else setCurrentCategory({...currentCategory, slug: e.target.value});
                                                    }}
                                                    required
                                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '0.75rem 0', fontWeight: '600' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="am-form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="am-form-group">
                                            <label className="am-label">Rank / Order</label>
                                                <div className="input-with-icon">
                                                <i className="fas fa-sort-amount-down input-icon"></i>
                                                <input 
                                                    type="number"
                                                    value={modalMode === 'SECTION' ? currentSection.rank : currentCategory.rank}
                                                    onChange={(e) => {
                                                        if (modalMode === 'SECTION') setCurrentSection({...currentSection, rank: e.target.value});
                                                        else setCurrentCategory({...currentCategory, rank: e.target.value});
                                                    }}
                                                    placeholder="0"
                                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '0.75rem 0', fontWeight: '600' }}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="am-form-group">
                                            <label className="am-label">Status</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '42px' }}>
                                                <label className="am-switch">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={modalMode === 'SECTION' ? currentSection.is_active : currentCategory.is_active}
                                                        onChange={(e) => {
                                                            if (modalMode === 'SECTION') setCurrentSection({...currentSection, is_active: e.target.checked});
                                                            else setCurrentCategory({...currentCategory, is_active: e.target.checked});
                                                        }}
                                                    />
                                                    <span className="am-slider"></span>
                                                </label>
                                                <span style={{ fontWeight: '600', color: (modalMode === 'SECTION' ? currentSection.is_active : currentCategory.is_active) ? '#10b981' : '#64748b' }}>
                                                    {(modalMode === 'SECTION' ? currentSection.is_active : currentCategory.is_active) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(modalMode === 'TOPIC' || currentCategory.isLevel4) && (
                                    <div className="form-section alternate-bg">
                                        <div className="section-header-row">
                                            <h3 className="section-title" style={{ paddingLeft: 0 }}>Topic Content (Level 4/5)</h3>
                                        </div>

                                        <div className="am-level4-fields animated slideDown">
                                            <div className="am-form-group">
                                                <label className="am-label">Content (HTML)</label>
                                                <textarea 
                                                    className="am-input am-textarea"
                                                    value={currentCategory.content}
                                                    onChange={(e) => setCurrentCategory({...currentCategory, content: e.target.value})}
                                                    placeholder="HTML content for this topic..."
                                                    rows="4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="am-modal-footer premium-footer">
                                <button type="button" className="am-btn-ghost" onClick={handleCloseModal}>
                                    <i className="fas fa-times"></i> Cancel
                                </button>
                                <button type="submit" className="am-btn-primary elevated" disabled={actionLoading}>
                                    {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : (
                                        isEditing ? 'Save Changes' : (
                                            modalMode === 'SECTION' ? 'Create Section' :
                                            modalMode === 'CATEGORY' ? 'Create Category' :
                                            modalMode === 'SUB_CATEGORY' ? 'Create Sub-Category' :
                                            modalMode === 'SEGMENT' ? 'Create Segment' :
                                            modalMode === 'TOPIC' ? 'Create Topic' :
                                            'Save'
                                        )
                                    )}
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
