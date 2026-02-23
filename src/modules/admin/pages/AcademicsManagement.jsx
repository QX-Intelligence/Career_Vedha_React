import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
// import { academicsService } from '../../../services/academicsService'; // Removed direct service usage
import { 
    useLevels, useCreateLevel, useUpdateLevel,
    useSubjects, useCreateSubject, useUpdateSubject,
    useChapters, useCreateChapter, useUpdateChapter,
    useMaterials, useCreateMaterial, useUpdateMaterial,
    useCategories, useAcademicsHierarchy, useAcademicsDjangoHierarchy
} from '../../../hooks/useAcademics';
import CMSLayout from '../../../components/layout/CMSLayout';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getUserContext } from '../../../services/api';
import { checkAccess as checkAccessGlobal, MODULES } from '../../../config/accessControl.config.js';
import Skeleton, { SkeletonTable } from '../../../components/ui/Skeleton';
import './AcademicsManagement.css';

import MediaLibraryModal from '../../media/components/MediaLibraryModal';
import '../../../styles/MediaManagement.css'; // Import Media styles

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={title === 'Material Details' || title === 'Material Media' ? {maxWidth: '900px', width: '90%'} : {}}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const FormField = ({ label, children, error }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        {children}
        {error && <span className="error-text">{error}</span>}
    </div>
);


const AcademicsManagement = () => {
    const [activeTab, setActiveTab] = useState('hierarchy');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    
    // Media Library State
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaPickTarget, setMediaPickTarget] = useState(null); // 'icon', 'banner', 'document', 'content'

    // Media Preview State
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);

    const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { role: userRole } = getUserContext() || { role: null };

    // Form States
    const [formData, setFormData] = useState({});

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item }); // Pre-fill
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({});
        setModalMode('create');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const sidebarProps = {
        activeSection: 'academics',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: () => {
            // Simplified logout for demonstration
            navigate('/admin-login');
        },
        isCmsOpen: true,
        setIsCmsOpen: () => {}
    };

    const navbarProps = {
        title: 'Academics Management',
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    // Custom Hooks
    const { data: levels, isLoading: levelsLoading } = useLevels();
    const { data: subjects, isLoading: subjectsLoading } = useSubjects();
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: chapters, isLoading: chaptersLoading } = useChapters();
    const { data: materials, isLoading: materialsLoading } = useMaterials();
    const { data: hierarchy, isLoading: hierarchyLoading, refetch: refetchHierarchy } = useAcademicsDjangoHierarchy();


    // Mutations
    const createLevelMutation = useCreateLevel();
    const updateLevelMutation = useUpdateLevel();

    const createSubjectMutation = useCreateSubject();
    const updateSubjectMutation = useUpdateSubject();

    const createChapterMutation = useCreateChapter();
    const updateChapterMutation = useUpdateChapter();

    const createMaterialMutation = useCreateMaterial();
    const updateMaterialMutation = useUpdateMaterial();

    // Wrapping mutation notifications
    const handleMutationSuccess = (msg) => {
        showSnackbar(msg, 'success');
        closeModal();
    };
    const handleMutationError = (err, msg) => {
         showSnackbar(err?.message || msg, 'error');
    };

    // Override mutation calls with snackbar logic in handleSubmit instead of here to keep hooks clean, 
    // OR we can rely on Global Error handling if setup, but here we want specific success messages.
    // The hooks in useAcademics don't have onSuccess callbacks for snackbars passed in.
    // Let's attach them in handleSubmit or modify the hooks to accept callbacks.
    // Ideally, UI concerns like snackbars should be in the component.
    // Simplified loading state for all mutations
    const isSaving = createLevelMutation.isPending || 
                     updateLevelMutation.isPending || 
                     createSubjectMutation.isPending || 
                     updateSubjectMutation.isPending || 
                     createChapterMutation.isPending || 
                     updateChapterMutation.isPending || 
                     createMaterialMutation.isPending || 
                     updateMaterialMutation.isPending;

    const handleSubmit = async (e) => {
        if (isSaving) return;
        e.preventDefault();
        try {
            // Prepare data for submission - Use FormData for all to support files
            const submitData = { ...formData };
            
            // For Materials and Chapters, we need to extract media types
            if (activeTab === 'materials' || activeTab === 'chapters') {
                const libraryIds = (formData.media_links || [])
                    .filter(link => link.source === 'library')
                    .map(link => link.media_id);
                
                const localAttachments = (formData.media_links || [])
                    .filter(link => link.source === 'local')
                    .map(link => link.file);

                if (libraryIds.length > 0) submitData.media_ids = libraryIds;
                if (localAttachments.length > 0) submitData.attachments = localAttachments;

                // Flatten translations for materials
                if (activeTab === 'materials' && formData.translations) {
                    const eng = formData.translations.find(t => t.language === 'en') || {};
                    const tel = formData.translations.find(t => t.language === 'te') || {};
                    
                    submitData.eng_title = eng.title || '';
                    submitData.eng_summary = eng.summary || '';
                    submitData.eng_content = eng.content || '';
                    
                    submitData.tel_title = tel.title || '';
                    submitData.tel_summary = tel.summary || '';
                    submitData.tel_content = tel.content || '';
                }
                
                // Remove UI-only fields
                delete submitData.media_links;
                delete submitData.translations;
                delete submitData._activeLang;
                delete submitData.icon_url;
                delete submitData.banner_url;
                delete submitData.document_name;
            }

            console.log(`[Academics] Submitting ${activeTab} (${modalMode}):`, submitData);

            if (activeTab === 'levels') {
                if (modalMode === 'create') {
                    await createLevelMutation.mutateAsync(submitData);
                    handleMutationSuccess('Level created successfully');
                } else {
                    await updateLevelMutation.mutateAsync({ id: editingItem.id, data: submitData });
                    handleMutationSuccess('Level updated successfully');
                }
            } else if (activeTab === 'subjects') {
                 if (modalMode === 'create') {
                    await createSubjectMutation.mutateAsync(submitData);
                    handleMutationSuccess('Subject created successfully');
                 } else {
                    await updateSubjectMutation.mutateAsync({ id: editingItem.id, data: submitData });
                    handleMutationSuccess('Subject updated successfully');
                 }
            } else if (activeTab === 'chapters') {
                 if (modalMode === 'create') {
                    await createChapterMutation.mutateAsync(submitData);
                    handleMutationSuccess('Chapter created successfully');
                 } else {
                    await updateChapterMutation.mutateAsync({ id: editingItem.id, data: submitData });
                    handleMutationSuccess('Chapter updated successfully');
                 }
            } else if (activeTab === 'materials') {
                 if (modalMode === 'create') {
                    await createMaterialMutation.mutateAsync(submitData);
                    handleMutationSuccess('Material created successfully');
                 } else {
                    await updateMaterialMutation.mutateAsync({ id: editingItem.id, data: submitData });
                    handleMutationSuccess('Material updated successfully');
                 }
            }
        } catch (error) {
            console.error(`[Academics] ${activeTab} ${modalMode} Error:`, error);
            console.error(`[Academics] Error Payload:`, error.response?.data);
            handleMutationError(error, `Failed to ${modalMode} ${activeTab.slice(0,-1)}`);
        }
    };

    const tabs = [
        { id: 'hierarchy', label: 'Hierarchy', icon: '🌳' },
        { id: 'levels', label: 'Levels', icon: '🎓' },
        { id: 'subjects', label: 'Subjects', icon: '📚' },
        { id: 'chapters', label: 'Chapters', icon: '📖' },
        { id: 'materials', label: 'Materials', icon: '📄' },
    ];

    const getStatusBadge = (status) => {
        const statuses = {
            'PUBLISHED': 'success',
            'DRAFT': 'warning',
            'ARCHIVED': 'secondary'
        };
        const color = statuses[status] || 'secondary';
        return <span className={`badge badge-${color}`}>{status}</span>;
    };

    const handleView = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleMediaSelect = (id, url, mediaObj) => {
        if (mediaPickTarget === 'icon') {
            setFormData({ ...formData, icon_media_id: id, icon_url: url });
        } else if (mediaPickTarget === 'banner') {
            setFormData({ ...formData, banner_media_id: id, banner_url: url });
        } else if (mediaPickTarget === 'document') {
            setFormData({ ...formData, document_media_id: id, document_name: mediaObj?.title || 'Selected document' });
        } else {
            const newLinks = [...(formData.media_links || [])];
            newLinks.push({
                source: 'library',
                media_id: id,
                media_url: url,
                thumbnail_url: url,
                usage: 'content',
                title: mediaObj?.title || '',
                media_type: mediaObj?.media_type || 'unknown'
            });
            setFormData({ ...formData, media_links: newLinks });
        }
        setIsMediaModalOpen(false);
        setMediaPickTarget(null);
    };

    const handleLocalFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newLinks = [...(formData.media_links || [])];
        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            newLinks.push({
                source: 'local',
                file: file,
                media_url: URL.createObjectURL(file),
                thumbnail_url: isImage ? URL.createObjectURL(file) : null,
                usage: 'content',
                title: file.name,
                media_type: file.type.split('/')[0] || 'unknown'
            });
        });
        setFormData({ ...formData, media_links: newLinks });
        // Reset input
        e.target.value = '';
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="academics-mgmt-container">
                <div className="mgmt-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mgmt-content">
                    {activeTab === 'hierarchy' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Academics Hierarchy</h3>
                                <button className="add-btn" onClick={() => refetchHierarchy()} disabled={hierarchyLoading}>
                                    <i className={`fas ${hierarchyLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`} style={{marginRight: '8px'}}></i>
                                    {hierarchyLoading ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                            
                            {hierarchyLoading ? (
                                <Skeleton count={3} height={100} style={{marginBottom: '20px', borderRadius: '15px'}} />
                            ) : (
                                <div className="hierarchy-tree">
                                    {hierarchy?.length > 0 ? hierarchy.map(level => (
                                        <div key={level.id} className="hierarchy-level-box">
                                            <div className="level-header-row">
                                                <div className="level-main-info">
                                                    <span className="level-icon">🎓</span>
                                                    <div className="level-text">
                                                        <h4>{level.name}</h4>
                                                        <span className="board-pills">{level.board}</span>
                                                    </div>
                                                </div>
                                                <div className="level-actions">
                                                    <button className="icon-btn edit" onClick={() => handleEdit(level)}><i className="fas fa-edit"></i></button>
                                                </div>
                                            </div>

                                            <div className="level-subjects-container">
                                                {level.subjects?.length > 0 ? level.subjects.map(subject => (
                                                    <div key={subject.id} className="hierarchy-subject-card">
                                                        <div className="subject-header">
                                                            <h5>{subject.name}</h5>
                                                            <button className="icon-btn edit small" onClick={() => handleEdit(subject)}><i className="fas fa-edit"></i></button>
                                                        </div>
                                                        <div className="subject-chapters-list">
                                                            {subject.chapters?.length > 0 ? subject.chapters.map(chapter => (
                                                                <div key={chapter.id} className="hierarchy-chapter-pill" onClick={() => handleEdit(chapter)}>
                                                                    <i className="fas fa-book-open"></i>
                                                                    <span>{chapter.name}</span>
                                                                </div>
                                                            )) : <span className="empty-text">No Chapters</span>}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="empty-info" style={{padding: '1rem', textAlign: 'center', width: '100%', color: '#94a3b8'}}>
                                                        <p>No subjects assigned to this level yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="placeholder-info">
                                            <i className="fas fa-sitemap"></i>
                                            <p>No academics hierarchy data found.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'levels' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Academic Levels</h3>
                                <button className="add-btn" onClick={handleAdd}>+ Add Level</button>
                            </div>
                            <div className="mgmt-table-container">
                                {levelsLoading ? (
                                    <SkeletonTable rows={5} columns={6} />
                                ) : (
                                    <table className="mgmt-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Board</th>
                                                <th>Rank</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(levels) ? levels : levels?.results || []).map(level => (
                                                <tr key={level.id}>
                                                    <td>{level.id}</td>
                                                    <td className="font-semibold">{level.name}</td>
                                                    <td><span className="badge">{level.board}</span></td>
                                                    <td>{level.rank}</td>
                                                    <td>
                                                        <span className={`status-dot ${level.is_active ? 'active' : 'inactive'}`}></span>
                                                        {level.is_active ? 'Active' : 'Disabled'}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button className="icon-btn edit" onClick={() => handleEdit(level)}><i className="fas fa-edit"></i></button>
                                                        <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Subjects</h3>
                                <button className="add-btn" onClick={handleAdd}>+ Add Subject</button>
                            </div>
                            <div className="mgmt-table-container">
                                {subjectsLoading ? (
                                    <SkeletonTable rows={5} columns={6} />
                                ) : (
                                    <table className="mgmt-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Level</th>
                                                <th>Name</th>
                                                {/* <th>Slug</th> */}
                                                <th>Rank</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(subjects) ? subjects : subjects?.results || []).map(subject => (
                                                <tr key={subject.id}>
                                                    <td>{subject.id}</td>
                                                    <td>
                                                        <span className="badge">{subject.level_name || (levels?.find(l => l.id === subject.level)?.name)}</span>
                                                    </td>
                                                    <td className="font-semibold">{subject.name}</td>
                                                    <td><code>{subject.slug}</code></td>
                                                    <td>{subject.rank}</td>
                                                    <td className="actions-cell">
                                                        <button className="icon-btn edit" onClick={() => handleEdit(subject)}><i className="fas fa-edit"></i></button>
                                                        <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'chapters' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Chapters</h3>
                                <button className="add-btn" onClick={handleAdd}>+ Add Chapter</button>
                            </div>
                            <div className="mgmt-table-container">
                                {chaptersLoading ? (
                                    <SkeletonTable rows={5} columns={5} />
                                ) : (
                                    <table className="mgmt-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Subject</th>
                                                <th>Name</th>
                                                <th>Rank</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(chapters) ? chapters : chapters?.results || []).map(chapter => (
                                                <tr key={chapter.id}>
                                                    <td>{chapter.id}</td>
                                                    <td>
                                                        <span className="badge">{chapter.subject_name || (subjects?.find(s => s.id === chapter.subject)?.name)}</span>
                                                    </td>
                                                    <td className="font-semibold">{chapter.name}</td>
                                                    <td>{chapter.rank}</td>
                                                    <td className="actions-cell">
                                                        <button className="icon-btn edit" onClick={() => handleEdit(chapter)}><i className="fas fa-edit"></i></button>
                                                        <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'materials' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Materials</h3>
                                <button className="add-btn" onClick={handleAdd}>+ Add Material</button>
                            </div>
                            <div className="mgmt-table-container">
                                {materialsLoading ? (
                                    <SkeletonTable rows={5} columns={6} />
                                ) : (
                                    <table className="mgmt-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Title</th>
                                                <th>Type</th>
                                                <th>Chapter</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(materials) ? materials : materials?.results || []).map(material => {
                                                const catName = material.category_name || categories?.find(c => c.id === material.category)?.name;
                                                const chName = material.chapter_name || chapters?.find(ch => ch.id === material.chapter)?.name;
                                                
                                                return (
                                                    <tr key={material.id}>
                                                        <td>{material.id}</td>
                                                        <td className="font-semibold">
                                                            {material.translations?.find(t => t.language === 'en')?.title || 
                                                             material.translations?.[0]?.title || 
                                                             'Untitled'}
                                                        </td>
                                                        <td><span className="badge">{catName || 'General'}</span></td>
                                                        <td>{chName || '-'}</td>
                                                        <td>{getStatusBadge(material.status)}</td>
                                                        <td className="actions-cell">
                                                            <button className="icon-btn edit" title="View Details" onClick={() => handleView(material)}>
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button className="icon-btn edit" title="Edit" onClick={() => handleEdit(material)}>
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={modalMode === 'view' ? 'Material Details' : `${modalMode === 'create' ? 'Add' : 'Edit'} ${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())}`}
            >
                {modalMode === 'view' ? (
                     <div className="view-mode-container">
                        <div className="media-grid-view mm-grid">
                            {formData.media_links?.length > 0 ? formData.media_links.map((link, idx) => {
                                const getMediaType = (url, storedType) => {
                                    if (storedType && storedType !== 'unknown') return storedType;
                                    if (!url) return 'unknown';
                                    try {
                                        // Remove query params for extension check
                                        const cleanUrl = url.split('?')[0]; 
                                        const ext = cleanUrl.split('.').pop().toLowerCase();
                                        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
                                        if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
                                        if (ext === 'pdf') return 'pdf';
                                        if (['doc', 'docx', 'txt'].includes(ext)) return 'doc';
                                    } catch (e) {
                                        console.error('URL parsing error', e);
                                    }
                                    return 'unknown';
                                };
                                const type = getMediaType(link.media_url, link.media_type);

                                return (
                                    <div key={idx} className="mm-card" style={{height: '240px'}}>
                                        <div className="mm-media-wrapper" style={{height: '160px'}} onClick={() => {
                                            if (type === 'image' || type === 'video' || type === 'pdf') {
                                                setPreviewItem({ ...link, title: link.title || 'Media', media_type: type });
                                                setPreviewModalOpen(true);
                                            } else {
                                                window.open(link.media_url, '_blank');
                                            }
                                        }}>
                                            {type === 'video' ? (
                                                 <div className="mm-branded-skeleton">
                                                    <div className="mm-skeleton-icon"><i className="fas fa-video"></i></div>
                                                </div>
                                            ) : type === 'pdf' ? (
                                                <div className="mm-branded-skeleton">
                                                     <div className="mm-skeleton-icon" style={{color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)'}}><i className="fas fa-file-pdf"></i></div>
                                                </div>
                                            ) : type === 'doc' ? (
                                                 <div className="mm-branded-skeleton">
                                                     <div className="mm-skeleton-icon" style={{color: 'var(--primary-yellow-hover)', background: 'var(--primary-yellow-light)'}}><i className="fas fa-file-alt"></i></div>
                                                </div>
                                            ) : type === 'image' ? (

                                                 <img 
                                                    src={link.media_url} 
                                                    alt="preview" 
                                                    className="mm-grid-preview-image" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="mm-branded-skeleton"><div class="mm-skeleton-icon"><i class="fas fa-image"></i></div></div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="mm-branded-skeleton">
                                                     <div className="mm-skeleton-icon"><i className="fas fa-file"></i></div>
                                                </div>
                                            )}
                                            
                                            <div className="mm-glass-info">
                                                <h3 className="mm-card-title">{link.title || 'Untitled'}</h3>
                                                <div className="mm-meta">
                                                    <span><i className="fas fa-tag"></i> {type ? type.toUpperCase() : 'UNKNOWN'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mm-actions-footer">
                                             <button className="mm-action-btn view" title="View" onClick={(e) => {
                                                 e.stopPropagation();
                                                 if (type === 'image' || type === 'video' || type === 'pdf') {
                                                     setPreviewItem({ ...link, title: link.title || 'Media', media_type: type });
                                                     setPreviewModalOpen(true);
                                                 } else {
                                                     window.open(link.media_url, '_blank');
                                                 }
                                             }}>
                                                 <i className="fas fa-eye"></i>
                                             </button>
                                             <a href={link.media_url} target="_blank" rel="noopener noreferrer" className="mm-action-btn" title="Open External" onClick={e => e.stopPropagation()}>
                                                 <i className="fas fa-external-link-alt"></i>
                                             </a>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="mm-empty">
                                    <i className="fas fa-images"></i>
                                    <p>No media attached to this material.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer" style={{marginTop: '1.5rem'}}>
                             <button type="button" className="btn-secondary" onClick={() => setModalMode('edit')}>Switch to Edit Mode</button>
                             <button type="button" className="btn-primary" onClick={closeModal}>Close</button>
                        </div>
                     </div>
                ) : (
                <form onSubmit={handleSubmit} className="cms-form">
                    {/* ... existing form fields ... */}
                    {activeTab === 'levels' && (
                        <>
                            <FormField label="Name">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </FormField>
                            <FormField label="Board">
                                <select
                                    className="form-select"
                                    value={formData.board || 'AP'}
                                    onChange={e => setFormData({ ...formData, board: e.target.value })}
                                >
                                    <option value="AP">Andhra Pradesh</option>
                                    <option value="TS">Telangana</option>
                                    <option value="CBSE">CBSE</option>
                                    <option value="NONE">None</option>
                                </select>
                            </FormField>
                            <FormField label="Rank">
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.rank || 0}
                                    onChange={e => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                                />
                            </FormField>
                            <FormField label="Status">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active ?? true}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span className="slider"></span>
                                    <span className="label-text">{formData.is_active ? 'Active' : 'Disabled'}</span>
                                </label>
                            </FormField>
                        </>
                    )}

                    {activeTab === 'subjects' && (
                        <>
                            <FormField label="Level">
                                <select
                                    className="form-select"
                                    value={formData.level || ''}
                                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value="">Select Level</option>
                                    {levels?.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.board})</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Name">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </FormField>
                            <FormField label="Slug">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.slug || ''}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="auto-generated-if-empty"
                                />
                            </FormField>
                            <FormField label="Rank">
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.rank || 0}
                                    onChange={e => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                                />
                            </FormField>
                            <FormField label="Subject Icon (Optional)">
                                <div className="media-pick-row" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <input
                                        type="file"
                                        className="form-input"
                                        accept="image/*"
                                        onChange={e => setFormData({ ...formData, icon_file: e.target.files[0] })}
                                        style={{flex: 1}}
                                    />
                                    <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('icon'); setIsMediaModalOpen(true); }} style={{padding: '10px', height: '46px'}}>
                                        <i className="fas fa-images"></i> Library
                                    </button>
                                </div>
                                {formData.icon_url && <img src={formData.icon_url} alt="Current Icon" className="form-preview-thumb" />}
                            </FormField>
                        </>
                    )}

                    {activeTab === 'chapters' && (
                        <>
                            <FormField label="Subject">
                                <select
                                    className="form-select"
                                    value={formData.subject || ''}
                                    onChange={e => setFormData({ ...formData, subject: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.level_name})</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Name">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </FormField>
                             <FormField label="Slug">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.slug || ''}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="auto-generated-if-empty"
                                />
                            </FormField>
                             <FormField label="Rank">
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.rank || 0}
                                    onChange={e => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                                />
                            </FormField>
                            <FormField label="Chapter Banner (Optional)">
                                <div className="media-pick-row" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <input
                                        type="file"
                                        className="form-input"
                                        accept="image/*"
                                        onChange={e => setFormData({ ...formData, banner_file: e.target.files[0] })}
                                        style={{flex: 1}}
                                    />
                                    <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('banner'); setIsMediaModalOpen(true); }} style={{padding: '10px', height: '46px'}}>
                                        <i className="fas fa-images"></i> Library
                                    </button>
                                </div>
                                {formData.banner_url && <img src={formData.banner_url} alt="Current Banner" className="form-preview-thumb" />}
                            </FormField>
                            
                            {modalMode === 'create' && (
                                <>
                                    <div className="form-divider">Initial Introduction (One-Shot)</div>
                                    <FormField label="English Title">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.eng_title || ''}
                                            onChange={e => setFormData({ ...formData, eng_title: e.target.value })}
                                            placeholder="Intro to Chapter..."
                                        />
                                    </FormField>
                                    <FormField label="English Summary">
                                        <textarea
                                            className="form-textarea"
                                            rows="2"
                                            value={formData.eng_summary || ''}
                                            onChange={e => setFormData({ ...formData, eng_summary: e.target.value })}
                                            placeholder="Brief overview..."
                                        ></textarea>
                                    </FormField>
                                    <FormField label="English Content (HTML)">
                                        <textarea
                                            className="form-textarea"
                                            rows="4"
                                            value={formData.eng_content || ''}
                                            onChange={e => setFormData({ ...formData, eng_content: e.target.value })}
                                            placeholder="<h1>Welcome</h1>..."
                                        ></textarea>
                                    </FormField>

                                    <div className="form-divider">Telugu Introduction (One-Shot)</div>
                                    <FormField label="Telugu Title">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.tel_title || ''}
                                            onChange={e => setFormData({ ...formData, tel_title: e.target.value })}
                                            placeholder="అధ్యాయం పరిచయం..."
                                        />
                                    </FormField>
                                    <FormField label="Telugu Summary">
                                        <textarea
                                            className="form-textarea"
                                            rows="2"
                                            value={formData.tel_summary || ''}
                                            onChange={e => setFormData({ ...formData, tel_summary: e.target.value })}
                                            placeholder="క్లుప్త వివరణ..."
                                        ></textarea>
                                    </FormField>
                                    <FormField label="Telugu Content (HTML)">
                                        <textarea
                                            className="form-textarea"
                                            rows="4"
                                            value={formData.tel_content || ''}
                                            onChange={e => setFormData({ ...formData, tel_content: e.target.value })}
                                            placeholder="<h1>స్వాగతం</h1>..."
                                        ></textarea>
                                    </FormField>

                                    <div className="form-divider">Intro Assets (One-Shot)</div>
                                    <FormField label="Chapter Document (PDF/Doc)">
                                        <div className="media-pick-row" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input
                                                type="file"
                                                className="form-input"
                                                onChange={e => setFormData({ ...formData, document_file: e.target.files[0] })}
                                                style={{flex: 1}}
                                            />
                                            <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('document'); setIsMediaModalOpen(true); }} style={{padding: '10px', height: '46px'}}>
                                                <i className="fas fa-file-alt"></i> Library
                                            </button>
                                        </div>
                                        {formData.document_name && <p className="form-meta-text"><i className="fas fa-check-circle"></i> {formData.document_name}</p>}
                                    </FormField>

                                    <FormField label="Additional Media (Library/System)">
                                        <div className="media-list" style={{background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1px dashed #cbd5e1'}}>
                                            {formData.media_links?.map((link, idx) => (
                                                <div key={idx} className="media-item-row">
                                                    <div className="media-info">
                                                        <span style={{fontWeight: 600}}>{link.title}</span>
                                                        <span className={`badge source-badge ${link.source}`}>{link.source}</span>
                                                    </div>
                                                    <button type="button" className="icon-btn delete" onClick={() => {
                                                        const nl = [...formData.media_links];
                                                        nl.splice(idx, 1);
                                                        setFormData({...formData, media_links: nl});
                                                    }}><i className="fas fa-times"></i></button>
                                                </div>
                                            ))}
                                            <div className="media-actions-row" style={{display: 'flex', gap: '8px'}}>
                                                <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('content'); setIsMediaModalOpen(true); }} style={{flex: 1}}>+ Library</button>
                                                <label className="btn-secondary small" style={{flex: 1, cursor: 'pointer', textAlign: 'center'}}>
                                                    + System <input type="file" multiple style={{display: 'none'}} onChange={handleLocalFileSelect} />
                                                </label>
                                            </div>
                                        </div>
                                    </FormField>
                                </>
                            )}
                        </>
                    )}
                    
                    {activeTab === 'materials' && (
                        <>
                            <div className="form-row">
                                <FormField label="Slug">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.slug || ''}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="unique-slug"
                                    />
                                </FormField>
                                <FormField label="Status">
                                    <select
                                        className="form-select"
                                        value={formData.status || 'DRAFT'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </FormField>
                            </div>

                            <div className="form-row">
                                <FormField label="Category">
                                    <select
                                        className="form-select"
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: parseInt(e.target.value) })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </FormField>
                                <FormField label="Chapter (Optional)">
                                    <select
                                        className="form-select"
                                        value={formData.chapter || ''}
                                        onChange={e => setFormData({ ...formData, chapter: e.target.value ? parseInt(e.target.value) : null })}
                                    >
                                        <option value="">No Chapter</option>
                                        {chapters?.map(ch => (
                                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                                        ))}
                                    </select>
                                </FormField>
                            </div>

                            <div className="form-divider">Translations</div>
                            <div className="translation-tabs">
                                {['en', 'te'].map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        className={`lang-tab ${(formData._activeLang || 'en') === lang ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, _activeLang: lang })}
                                    >
                                        {lang === 'en' ? 'English' : 'Telugu'}
                                    </button>
                                ))}
                            </div>

                            {['en', 'te'].map(lang => (
                                <div key={lang} style={{ display: (formData._activeLang || 'en') === lang ? 'block' : 'none' }}>
                                    <FormField label="Title">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.translations?.find(t => t.language === lang)?.title || ''}
                                            onChange={e => {
                                                const newTrans = [...(formData.translations || [])];
                                                const idx = newTrans.findIndex(t => t.language === lang);
                                                if (idx >= 0) newTrans[idx] = { ...newTrans[idx], title: e.target.value };
                                                else newTrans.push({ language: lang, title: e.target.value, summary: '', content: '' });
                                                setFormData({ ...formData, translations: newTrans });
                                            }}
                                        />
                                    </FormField>
                                    <FormField label="Summary">
                                        <textarea
                                            className="form-textarea"
                                            rows="2"
                                            value={formData.translations?.find(t => t.language === lang)?.summary || ''}
                                            onChange={e => {
                                                const newTrans = [...(formData.translations || [])];
                                                const idx = newTrans.findIndex(t => t.language === lang);
                                                if (idx >= 0) newTrans[idx] = { ...newTrans[idx], summary: e.target.value };
                                                else newTrans.push({ language: lang, title: '', summary: e.target.value, content: '' });
                                                setFormData({ ...formData, translations: newTrans });
                                            }}
                                        ></textarea>
                                    </FormField>
                                    <FormField label="Content (HTML)">
                                        <textarea
                                            className="form-textarea"
                                            rows="5"
                                            value={formData.translations?.find(t => t.language === lang)?.content || ''}
                                            onChange={e => {
                                                const newTrans = [...(formData.translations || [])];
                                                const idx = newTrans.findIndex(t => t.language === lang);
                                                if (idx >= 0) newTrans[idx] = { ...newTrans[idx], content: e.target.value };
                                                else newTrans.push({ language: lang, title: '', summary: '', content: e.target.value });
                                                setFormData({ ...formData, translations: newTrans });
                                            }}
                                        ></textarea>
                                    </FormField>
                                </div>
                            ))}
                            
                            <div className="form-divider">Banner & Document</div>
                            <div className="form-row">
                                <FormField label="Banner (Optional)">
                                    <div className="media-pick-row" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                        <input type="file" className="form-input" accept="image/*" onChange={e => setFormData({ ...formData, banner_file: e.target.files[0] })} style={{flex: 1}} />
                                        <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('banner'); setIsMediaModalOpen(true); }} style={{padding: '8px'}}><i className="fas fa-images"></i></button>
                                    </div>
                                    {formData.banner_url && <img src={formData.banner_url} alt="Banner" className="form-preview-thumb" style={{marginTop: '8px'}} />}
                                </FormField>
                                <FormField label="Main Document (Optional)">
                                    <div className="media-pick-row" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                        <input type="file" className="form-input" onChange={e => setFormData({ ...formData, document_file: e.target.files[0] })} style={{flex: 1}} />
                                        <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('document'); setIsMediaModalOpen(true); }} style={{padding: '8px'}}><i className="fas fa-file-alt"></i></button>
                                    </div>
                                    {formData.document_name && <p className="form-meta-text"><i className="fas fa-check-circle"></i> {formData.document_name}</p>}
                                </FormField>
                            </div>

                            <div className="form-divider">Additional Media Attachments</div>
                            <div className="media-list">
                                {formData.media_links?.map((link, idx) => (
                                    <div key={idx} className="media-item-row">
                                        {link.thumbnail_url ? (
                                            <img src={link.thumbnail_url} alt="thumb" className="media-thumb-small" />
                                        ) : (
                                            <div className="media-thumb-small mm-branded-skeleton" style={{width: '48px', height: '48px', minWidth: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-100)'}}>
                                                <i className={`fas ${link.media_type === 'application' || link.media_type === 'pdf' ? 'fa-file-pdf' : 'fa-file'}`} style={{fontSize: '1rem', color: 'var(--slate-400)'}}></i>
                                            </div>
                                        )}
                                        <div className="media-info">
                                            <div className="media-title-row" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <span className="media-link" style={{color: 'var(--slate-900)', fontWeight: '600', fontSize: '0.9rem'}}>
                                                    {link.title || 'Untitled Asset'}
                                                </span>
                                                <span className={`badge source-badge ${link.source}`} style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    background: link.source === 'library' ? 'var(--primary-yellow-light)' : 'var(--slate-100)',
                                                    color: link.source === 'library' ? 'var(--primary-yellow-hover)' : 'var(--slate-600)',
                                                    border: 'none'
                                                }}>
                                                    {link.source === 'library' ? 'Library' : 'System'}
                                                </span>
                                            </div>
                                            <span className="badge" style={{fontSize: '0.7rem'}}>{link.usage}</span>
                                        </div>

                                        <button 
                                            type="button" 
                                            className="icon-btn delete"
                                            onClick={() => {
                                                const newLinks = [...formData.media_links];
                                                newLinks.splice(idx, 1);
                                                if (link.source === 'local' && link.media_url) {
                                                    URL.revokeObjectURL(link.media_url);
                                                }
                                                setFormData({ ...formData, media_links: newLinks });
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                                <div className="media-actions-row" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                    <button type="button" className="btn-secondary small" onClick={() => { setMediaPickTarget('content'); setIsMediaModalOpen(true); }} style={{flex: 1, padding: '8px'}}>
                                        <i className="fas fa-images"></i> Library
                                    </button>
                                    <label className="btn-secondary small upload-label" style={{flex: 1, padding: '8px', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                                        <i className="fas fa-upload"></i> System
                                        <input 
                                            type="file" 
                                            multiple 
                                            style={{display: 'none'}} 
                                            onChange={handleLocalFileSelect}
                                        />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSaving}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? (
                                <><i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i> Processing...</>
                            ) : (
                                modalMode === 'create' ? 'Create' : 'Update'
                            )}
                        </button>
                    </div>
                </form>
            )}
            </Modal>
                
            {/* Media Library Modal */}
            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleMediaSelect}
                targetType="general"
            />

            {/* Preview Modal */}
            {previewModalOpen && previewItem && (
                <div className="mm-modal-overlay preview-overlay" style={{zIndex: 1100}}>
                    <div className="mm-preview-modal">
                        <button className="mm-close-preview" onClick={() => setPreviewModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="mm-preview-content" style={{height: '80vh'}}>
                            {previewItem.media_type === 'pdf' ? (
                                <iframe src={previewItem.media_url} title={previewItem.title} className="mm-media-iframe" style={{width: '100%', height: '100%', border: 'none'}} />
                            ) : previewItem.media_type === 'video' ? (
                                <video controls autoPlay src={previewItem.media_url} className="mm-media-view" style={{maxWidth: '100%', maxHeight: '100%'}} />
                            ) : (
                                <img src={previewItem.media_url} alt={previewItem.title} className="mm-media-view" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                            )}
                        </div>
                    </div>
                </div>
            )}

        </CMSLayout>
    );
};

export default AcademicsManagement;
