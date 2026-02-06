import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsService } from '../../../services/academicsService';
import CMSLayout from '../../../components/layout/CMSLayout';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getUserContext } from '../../../services/api';
import { checkAccess as checkAccessGlobal, MODULES } from '../../../config/accessControl.config.js';
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
    const [activeTab, setActiveTab] = useState('levels');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    
    // Media Library State
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

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

    // Queries
    const { data: levels, isLoading: levelsLoading } = useQuery({
        queryKey: ['admin-levels'],
        queryFn: () => academicsService.getAdminLevels(),
    });

    const { data: subjects, isLoading: subjectsLoading } = useQuery({
        queryKey: ['admin-subjects'],
        queryFn: () => academicsService.getAdminSubjects(),
    });

    const { data: categories } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: () => academicsService.getAdminCategories(),
    });


    const { data: chapters, isLoading: chaptersLoading } = useQuery({
        queryKey: ['admin-chapters'],
        queryFn: () => academicsService.getAdminChapters(),
    });

    const { data: materials, isLoading: materialsLoading } = useQuery({
        queryKey: ['admin-materials'],
        queryFn: () => academicsService.getAdminMaterials(),
    });

    // Mutations
    const createLevelMutation = useMutation({
        mutationFn: academicsService.createLevel,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-levels']);
            showSnackbar('Level created successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to create level', 'error')
    });

    const updateLevelMutation = useMutation({
        mutationFn: ({ id, data }) => academicsService.updateLevel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-levels']);
            showSnackbar('Level updated successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to update level', 'error')
    });

    // Subject Mutations
    const createSubjectMutation = useMutation({
        mutationFn: academicsService.createSubject,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-subjects']);
            showSnackbar('Subject created successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to create subject', 'error')
    });

    const updateSubjectMutation = useMutation({
        mutationFn: ({ id, data }) => academicsService.updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-subjects']);
            showSnackbar('Subject updated successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to update subject', 'error')
    });

    // Chapter Mutations
    const createChapterMutation = useMutation({
        mutationFn: academicsService.createChapter,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-chapters']);
            showSnackbar('Chapter created successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to create chapter', 'error')
    });

    const updateChapterMutation = useMutation({
        mutationFn: ({ id, data }) => academicsService.updateChapter(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-chapters']);
            showSnackbar('Chapter updated successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to update chapter', 'error')
    });

    // Material Mutations
    const createMaterialMutation = useMutation({
        mutationFn: academicsService.createMaterial,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-materials']);
            showSnackbar('Material created successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to create material', 'error')
    });

    const updateMaterialMutation = useMutation({
        mutationFn: ({ id, data }) => academicsService.updateMaterial(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-materials']);
            showSnackbar('Material updated successfully', 'success');
            closeModal();
        },
        onError: (err) => showSnackbar(err.message || 'Failed to update material', 'error')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'levels') {
                if (modalMode === 'create') await createLevelMutation.mutateAsync(formData);
                else await updateLevelMutation.mutateAsync({ id: editingItem.id, data: formData });
            } else if (activeTab === 'subjects') {
                 if (modalMode === 'create') await createSubjectMutation.mutateAsync(formData);
                 else await updateSubjectMutation.mutateAsync({ id: editingItem.id, data: formData });
            } else if (activeTab === 'chapters') {
                 if (modalMode === 'create') await createChapterMutation.mutateAsync(formData);
                 else await updateChapterMutation.mutateAsync({ id: editingItem.id, data: formData });
            } else if (activeTab === 'materials') {
                 if (modalMode === 'create') await createMaterialMutation.mutateAsync(formData);
                 else await updateMaterialMutation.mutateAsync({ id: editingItem.id, data: formData });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const tabs = [
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
        const newLinks = [...(formData.media_links || [])];
        newLinks.push({
            media_id: id,
            media_url: url,
            thumbnail_url: url, // Assuming image for now, backend handles actual details
            usage: 'content',
            title: mediaObj?.title || '',
            media_type: mediaObj?.media_type || 'unknown'
        });
        setFormData({ ...formData, media_links: newLinks });
        setIsMediaModalOpen(false);
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
                    {activeTab === 'levels' && (
                        <div className="mgmt-section">
                            <div className="section-header">
                                <h3>Academic Levels</h3>
                                <button className="add-btn" onClick={handleAdd}>+ Add Level</button>
                            </div>
                            <div className="mgmt-table-container">
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
                                <table className="mgmt-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Level</th>
                                            <th>Name</th>
                                            <th>Slug</th>
                                            <th>Rank</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(subjects) ? subjects : subjects?.results || []).map(subject => (
                                            <tr key={subject.id}>
                                                <td>{subject.id}</td>
                                                <td>{subject.level_name}</td>
                                                <td className="font-semibold">{subject.name}</td>
                                                <td>{subject.slug}</td>
                                                <td>{subject.rank}</td>
                                                <td className="actions-cell">
                                                    <button className="icon-btn edit" onClick={() => handleEdit(subject)}><i className="fas fa-edit"></i></button>
                                                    <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                <table className="mgmt-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Subject</th>
                                            <th>Name</th>
                                            <th>Slug</th>
                                            <th>Rank</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(chapters) ? chapters : chapters?.results || []).map(chapter => (
                                            <tr key={chapter.id}>
                                                <td>{chapter.id}</td>
                                                <td>{chapter.subject_name || '-'}</td>
                                                <td className="font-semibold">{chapter.name}</td>
                                                <td>{chapter.slug}</td>
                                                <td>{chapter.rank}</td>
                                                <td className="actions-cell">
                                                    <button className="icon-btn edit" onClick={() => handleEdit(chapter)}><i className="fas fa-edit"></i></button>
                                                    <button className="icon-btn delete"><i className="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        {(Array.isArray(materials) ? materials : materials?.results || []).map(material => (
                                            <tr key={material.id}>
                                                <td>{material.id}</td>
                                                <td className="font-semibold">
                                                    {material.translations?.find(t => t.language === 'en')?.title || 
                                                     material.translations?.[0]?.title || 
                                                     'Untitled'}
                                                </td>
                                                <td><span className="badge">{material.category_name}</span></td>
                                                <td>{material.chapter_name || '-'}</td>
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
                                        ))}
                                    </tbody>
                                </table>
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
                                                     <div className="mm-skeleton-icon" style={{color: '#ef4444', background: '#fee2e2'}}><i className="fas fa-file-pdf"></i></div>
                                                </div>
                                            ) : type === 'doc' ? (
                                                 <div className="mm-branded-skeleton">
                                                     <div className="mm-skeleton-icon" style={{color: '#3b82f6', background: '#dbeafe'}}><i className="fas fa-file-alt"></i></div>
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
                                                else newTrans.push({ language: lang, title: e.target.value, content: '' });
                                                setFormData({ ...formData, translations: newTrans });
                                            }}
                                        />
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
                                                else newTrans.push({ language: lang, title: '', content: e.target.value });
                                                setFormData({ ...formData, translations: newTrans });
                                            }}
                                        ></textarea>
                                    </FormField>
                                </div>
                            ))}
                            
                            <div className="form-divider">Media Links</div>
                            <div className="media-list">
                                {formData.media_links?.map((link, idx) => (
                                    <div key={idx} className="media-item-row">
                                        <img src={link.thumbnail_url} alt="thumb" className="media-thumb-small" />
                                        <div className="media-info">
                                            <a href={link.media_url} target="_blank" rel="noopener noreferrer" className="media-link" style={{color: '#3182ce', fontWeight: '500'}}>
                                                 {link.title || link.media_url?.substring(0, 30)}... <i className="fas fa-external-link-alt"></i>
                                            </a>
                                            <span className="badge">{link.usage}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="icon-btn delete"
                                            onClick={() => {
                                                const newLinks = [...formData.media_links];
                                                newLinks.splice(idx, 1);
                                                setFormData({ ...formData, media_links: newLinks });
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn-secondary small" onClick={() => setIsMediaModalOpen(true)}>
                                    + Add Media
                                </button>
                            </div>
                        </>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn-primary">
                            {modalMode === 'create' ? 'Create' : 'Update'}
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
