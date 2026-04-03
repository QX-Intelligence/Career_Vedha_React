import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopStories, useCreateTopStory, useUpdateTopStory, useDeleteTopStory } from '../../../hooks/useTopStories';
import './TopStoriesManagement.css';
import { useSnackbar } from '../../../context/SnackbarContext';
import CMSLayout from '../../../components/layout/CMSLayout';
import { getUserContext } from '../../../services/api';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import { newsService } from '../../../services';
import djangoApi from '../../../services/djangoApi';

// --- Media Picker Modal ---
const MediaPickerModal = ({ onClose, onSelect, selectedIds }) => {
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload'
    const [mediaAssets, setMediaAssets] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [localSelected, setLocalSelected] = useState(new Set(selectedIds));
    const [uploadFiles, setUploadFiles] = useState([]);      // files staged for upload
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState([]);  // { name, status, id }
    const fileInputRef = React.useRef(null);

    // Fetch server media library
    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const res = await djangoApi.get('media/', { params: { limit: 100 } });
                setMediaAssets(res.data?.results || res.data || []);
            } catch (e) {
                console.error('Error loading media:', e);
            } finally {
                setLoadingMedia(false);
            }
        };
        fetchMedia();
    }, []);

    const toggleMedia = (id) => {
        setLocalSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Handle local file selection (staging)
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadFiles(prev => [...prev, ...files]);
        setUploadResults([]);
    };

    const removeStaged = (idx) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== idx));
    };

    // Upload staged files to the media library
    const handleUpload = async () => {
        if (!uploadFiles.length) return;
        setUploading(true);
        const results = [];
        for (const file of uploadFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // strip extension as title
                const res = await djangoApi.post('media/upload/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const newId = res.data?.media_id;
                if (newId) {
                    setLocalSelected(prev => new Set([...prev, newId]));
                    // Add to media assets list so user sees it in 'Library' with correct structure
                    const newAsset = {
                        id: newId,
                        url: URL.createObjectURL(file), // temporary local URL for immediate preview
                        title: file.name,
                        media_type: file.type.startsWith('video') ? 'video' : 'image'
                    };
                    setMediaAssets(prev => [newAsset, ...prev]);
                }
                results.push({ name: file.name, status: 'success', id: newId });
            } catch (err) {
                results.push({ name: file.name, status: 'error', error: err?.response?.data?.detail || 'Upload failed' });
            }
        }
        setUploadResults(results);
        setUploading(false);
        setUploadFiles([]);
        // Switch to library tab to show the newly uploaded files
        if (results.some(r => r.status === 'success')) {
            setActiveTab('library');
        }
    };

    const tabStyle = (tab) => ({
        padding: '8px 20px',
        borderRadius: '8px 8px 0 0',
        border: 'none',
        background: activeTab === tab ? '#6366f1' : '#f1f5f9',
        color: activeTab === tab ? '#fff' : '#475569',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.15s',
    });

    return (
        <div className="am-modal-overlay">
            <div className="am-modal am-modal-content" style={{ maxWidth: '900px' }}>
                <div className="am-modal-header">
                    <h2><i className="fas fa-photo-video"></i> Select Media for Gallery</h2>
                    <button className="am-modal-close" onClick={onClose}>&times;</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 1.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: 0 }}>
                    <button style={tabStyle('library')} onClick={() => setActiveTab('library')}>
                        <i className="fas fa-images" style={{ marginRight: '6px' }}></i> Media Library
                    </button>
                    <button style={tabStyle('upload')} onClick={() => setActiveTab('upload')}>
                        <i className="fas fa-upload" style={{ marginRight: '6px' }}></i> Upload from Device
                    </button>
                </div>

                <div className="am-modal-body" style={{ minHeight: '340px' }}>
                    {/* Tab: Library */}
                    {activeTab === 'library' && (
                        loadingMedia ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#6366f1' }}></i>
                                <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading media library...</p>
                            </div>
                        ) : mediaAssets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                <i className="fas fa-images fa-3x" style={{ marginBottom: '1rem' }}></i>
                                <p>No media found. Upload files using the "Upload from Device" tab.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                {mediaAssets.map(asset => (
                                    <div
                                        key={asset.id}
                                        onClick={() => toggleMedia(asset.id)}
                                        style={{
                                            border: localSelected.has(asset.id) ? '3px solid #6366f1' : '2px solid #e2e8f0',
                                            borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                                            position: 'relative', transition: 'all 0.15s',
                                            boxShadow: localSelected.has(asset.id) ? '0 0 0 2px #a5b4fc' : 'none',
                                        }}
                                    >
                                        {asset.media_type === 'video' ? (
                                            <div style={{ width: '100%', height: '88px', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="fas fa-play-circle fa-2x" style={{ color: '#a5b4fc' }}></i>
                                            </div>
                                        ) : (
                                            <img src={asset.url} alt={asset.title} style={{ width: '100%', height: '88px', objectFit: 'cover', display: 'block' }} />
                                        )}
                                        <div style={{ padding: '4px 6px', fontSize: '11px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {asset.title || asset.media_type}
                                        </div>
                                        {localSelected.has(asset.id) && (
                                            <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#6366f1', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                                                <i className="fas fa-check"></i>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Tab: Upload from Device */}
                    {activeTab === 'upload' && (
                        <div>
                            {/* Drop zone / file picker */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed #a5b4fc', borderRadius: '12px', padding: '2.5rem',
                                    textAlign: 'center', cursor: 'pointer', background: '#eef2ff',
                                    marginBottom: '1.25rem', transition: 'all 0.2s'
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const files = Array.from(e.dataTransfer.files);
                                    setUploadFiles(prev => [...prev, ...files]);
                                }}
                            >
                                <i className="fas fa-cloud-upload-alt fa-2x" style={{ color: '#6366f1', marginBottom: '0.75rem' }}></i>
                                <p style={{ margin: 0, fontWeight: '700', color: '#4338ca', fontSize: '1rem' }}>
                                    Click to browse files or drag & drop here
                                </p>
                                <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '12px' }}>
                                    Supports: JPG, PNG, WebP, MP4, MOV — Max 20MB each
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Staged files list */}
                            {uploadFiles.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '0.5rem' }}>
                                        {uploadFiles.length} file(s) ready to upload:
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                                        {uploadFiles.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <i className={`fas fa-${f.type.startsWith('video') ? 'film' : 'image'}`} style={{ color: '#6366f1', width: '16px' }}></i>
                                                <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{(f.size / 1024).toFixed(0)} KB</span>
                                                <button onClick={() => removeStaged(i)} style={{ border: 'none', background: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        style={{
                                            marginTop: '0.75rem', width: '100%', padding: '10px',
                                            background: uploading ? '#a5b4fc' : '#6366f1', color: '#fff',
                                            border: 'none', borderRadius: '8px', fontWeight: '700',
                                            fontSize: '14px', cursor: uploading ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {uploading
                                            ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Uploading...</>
                                            : <><i className="fas fa-upload" style={{ marginRight: '8px' }}></i>Upload {uploadFiles.length} File(s) to Library</>}
                                    </button>
                                </div>
                            )}

                            {/* Upload results */}
                            {uploadResults.length > 0 && (
                                <div>
                                    {uploadResults.map((r, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
                                            background: r.status === 'success' ? '#f0fdf4' : '#fff1f2',
                                            border: `1px solid ${r.status === 'success' ? '#86efac' : '#fca5a5'}`,
                                        }}>
                                            <i className={`fas fa-${r.status === 'success' ? 'check-circle' : 'exclamation-circle'}`}
                                                style={{ color: r.status === 'success' ? '#16a34a' : '#dc2626' }}></i>
                                            <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{r.name}</span>
                                            <span style={{ fontSize: '12px', color: r.status === 'success' ? '#15803d' : '#b91c1c' }}>
                                                {r.status === 'success' ? `✓ Uploaded (ID: ${r.id})` : r.error}
                                            </span>
                                        </div>
                                    ))}
                                    {uploadResults.some(r => r.status === 'success') && (
                                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.5rem' }}>
                                            <i className="fas fa-info-circle" style={{ marginRight: '5px', color: '#6366f1' }}></i>
                                            Uploaded files have been added to your selection. Switch to "Media Library" to confirm.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="am-modal-footer">
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        <i className="fas fa-check-circle" style={{ color: '#6366f1', marginRight: '6px' }}></i>
                        {localSelected.size} item(s) selected
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" className="am-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="am-btn-primary" onClick={() => { onSelect([...localSelected]); onClose(); }}>
                            <i className="fas fa-paperclip" style={{ marginRight: '6px' }}></i>
                            Attach to Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const TopStoriesManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { role: userRole } = getUserContext();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingStory, setEditingStory] = useState(null);
    const [isCmsOpen, setIsCmsOpen] = useState(true);
    const [categories, setCategories] = useState([]);

    const defaultForm = {
        title_en: '',
        title_te: '',
        description_en: '',
        description_te: '',
        slug: '',
        section: '',
        category: '',       // taxonomy category ID
        rank: 0,
        publish_date: new Date().toISOString().substring(0, 16),
        expiry_date: '',
        is_top_story: true,
        media_ids: [],      // array of MediaAsset IDs
    };
    const [formData, setFormData] = useState(defaultForm);

    // Auth Check
    useEffect(() => {
        const { isAuthenticated, role } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CREATOR', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];
        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    // Fetch taxonomy categories for dynamic dropdown
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await djangoApi.get('taxonomy/categories/', { params: { limit: 100 } });
                setCategories(res.data?.results || res.data || []);
            } catch (e) {
                console.error('Error loading categories:', e);
            }
        };
        loadCategories();
    }, []);

    const { data: storiesData, isLoading, isFetching, refetch } = useTopStories();
    const createMutation = useCreateTopStory();
    const updateMutation = useUpdateTopStory();
    const deleteMutation = useDeleteTopStory();

    const stories = useMemo(() => (storiesData?.results || storiesData) || [], [storiesData]);

    const filteredStories = useMemo(() => {
        if (!searchTerm.trim()) return stories;
        const term = searchTerm.toLowerCase();
        return stories.filter(s =>
            s.title_en?.toLowerCase().includes(term) ||
            s.title_te?.toLowerCase().includes(term) ||
            s.category_detail?.name?.toLowerCase().includes(term)
        );
    }, [searchTerm, stories]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = (story = null) => {
        if (story) {
            setEditingStory(story);
            setFormData({
                title_en: story.title_en || '',
                title_te: story.title_te || '',
                description_en: story.description_en || '',
                description_te: story.description_te || '',
                slug: story.slug || '',
                section: story.section || '',
                category: story.category || '',
                rank: story.rank ?? 0,
                publish_date: story.publish_date ? story.publish_date.substring(0, 16) : new Date().toISOString().substring(0, 16),
                expiry_date: story.expiry_date ? story.expiry_date.substring(0, 16) : '',
                is_top_story: story.is_top_story ?? true,
                media_ids: story.media ? story.media.map(m => m.media_details?.id).filter(Boolean) : [],
            });
        } else {
            setEditingStory(null);
            setFormData(defaultForm);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                title_en: formData.title_en,
                title_te: formData.title_te || '',
                description_en: formData.description_en || '',
                description_te: formData.description_te || '',
                slug: formData.slug || '',
                section: formData.section || '',
                category: formData.category ? parseInt(formData.category, 10) : null,
                rank: parseInt(formData.rank, 10) || 0,
                publish_date: formData.publish_date,
                is_top_story: true,
                media_ids: formData.media_ids,
            };
            if (formData.expiry_date) payload.expiry_date = formData.expiry_date;

            if (editingStory) {
                await updateMutation.mutateAsync({ id: editingStory.id, data: payload });
                showSnackbar('Top story updated successfully!', 'success');
            } else {
                await createMutation.mutateAsync(payload);
                showSnackbar('Top story created successfully!', 'success');
            }
            closeModal();
        } catch (error) {
            showSnackbar(error.response?.data?.detail || error.response?.data?.error || (editingStory ? 'Failed to update story' : 'Failed to create story'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will remove the story and un-link all gallery items.')) {
            try {
                await deleteMutation.mutateAsync(id);
                showSnackbar('Story deleted successfully', 'success');
            } catch {
                showSnackbar('Failed to delete story', 'error');
            }
        }
    };

    const sidebarProps = {
        activeSection: 'top-stories',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: () => navigate('/admin-login'),
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: 'Top Stories Management',
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    // Helper: get first image from gallery
    const getGalleryThumb = (story) => {
        const imgs = story.media?.filter(m => m.media_details?.media_type === 'image');
        return imgs?.[0]?.media_details?.url || null;
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="ts-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ts-title-section">
                        <h1 className="ts-title"><i className="fas fa-star"></i> Top Stories Management</h1>
                        <p className="ts-subtitle">Bilingual stories with rich media galleries and dynamic categories</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="am-btn-secondary" onClick={() => refetch()} disabled={isFetching}>
                            <i className={`fas fa-sync-alt ${isFetching ? 'fa-spin' : ''}`}></i>
                        </button>
                        <button className="am-btn-primary" onClick={() => openModal()}>
                            <i className="fas fa-plus"></i> Add Top Story
                        </button>
                    </div>
                </div>
            </div>

            <div className="am-filter-bar" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
                <div className="am-search-form" style={{ maxWidth: '400px' }}>
                    <div className="am-search-wrapper">
                        <i className="fas fa-search am-search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search by title (EN/TE) or category..."
                            className="am-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <span className="am-status-badge draft" style={{ textTransform: 'none' }}>
                    Total Stories: <strong>{stories.length}</strong>
                </span>
            </div>

            <div className="ts-content">
                {isLoading ? (
                    <div className="ts-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading stories...</p>
                    </div>
                ) : filteredStories.length > 0 ? (
                    <div className="ts-table-container">
                        <table className="ts-table">
                            <thead>
                                <tr>
                                    <th>Story (EN / TE)</th>
                                    <th>Category</th>
                                    <th>Gallery</th>
                                    <th>Dates</th>
                                    <th>Rank</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStories.map(story => (
                                    <tr key={story.id}>
                                        <td>
                                            <div className="ts-row-info">
                                                {getGalleryThumb(story) ? (
                                                    <img src={getGalleryThumb(story)} alt="" className="ts-thumb" />
                                                ) : (
                                                    <div className="ts-thumb" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fas fa-image" style={{ color: '#cbd5e1' }}></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="ts-text-main">{story.title_en}</div>
                                                    <div className="ts-text-sub" style={{ direction: 'rtl', textAlign: 'left', fontFamily: 'serif', color: '#059669' }}>{story.title_te}</div>
                                                    <div className="ts-text-desc" style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {story.description_en || story.description || story.summary || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="ts-badge category">
                                                {story.category_detail?.name || `ID: ${story.category}`}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                                <i className="fas fa-images" style={{ marginRight: '6px', color: '#6366f1' }}></i>
                                                {story.media?.length || 0} items
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ts-text-main" style={{ fontSize: '0.83rem' }}>
                                                <i className="far fa-calendar-alt" style={{ marginRight: '5px', color: 'var(--cv-primary)' }}></i>
                                                {new Date(story.publish_date).toLocaleDateString()}
                                            </div>
                                            {story.expiry_date && (
                                                <div className="ts-text-sub">Expires: {new Date(story.expiry_date).toLocaleDateString()}</div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--cv-primary)', fontWeight: '800' }}>#{story.rank}</span>
                                        </td>
                                        <td>
                                            <div className="ts-actions">
                                                <LuxuryTooltip content="Edit Story">
                                                    <button className="ts-action-btn edit" onClick={() => openModal(story)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                </LuxuryTooltip>
                                                <LuxuryTooltip content="Delete Story">
                                                    <button className="ts-action-btn delete" onClick={() => handleDelete(story.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </LuxuryTooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="ts-empty-state">
                        <i className="fas fa-newspaper"></i>
                        <h3>No top stories found</h3>
                        <p>Try adjusting your search or add a new featured story.</p>
                    </div>
                )}
            </div>

            {/* --- Create / Edit Modal --- */}
            {isModalOpen && (
                <div className="am-modal-overlay">
                    <div className="am-modal am-modal-content" style={{ maxWidth: '740px' }}>
                        <div className="am-modal-header">
                            <h2>{editingStory ? '✏️ Edit Top Story' : '✨ Create New Top Story'}</h2>
                            <button className="am-modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="am-modal-body">

                                {/* --- Bilingual Titles --- */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.75rem 0', fontWeight: '700', color: '#1e293b', fontSize: '0.875rem' }}>
                                        <i className="fas fa-language" style={{ marginRight: '8px', color: '#6366f1' }}></i>
                                        Bilingual Title
                                    </p>
                                    <div className="am-form-group">
                                        <label className="am-label">Title (English) *</label>
                                        <input type="text" name="title_en" className="am-input" value={formData.title_en} onChange={handleInputChange} placeholder="Enter English headline..." required />
                                    </div>
                                    <div className="am-form-group" style={{ marginBottom: 0 }}>
                                        <label className="am-label">Title (Telugu)</label>
                                        <input type="text" name="title_te" className="am-input" value={formData.title_te} onChange={handleInputChange} placeholder="శీర్షికను నమోదు చేయండి..." style={{ fontFamily: 'serif' }} />
                                    </div>
                                </div>

                                {/* --- Bilingual Descriptions --- */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.75rem 0', fontWeight: '700', color: '#1e293b', fontSize: '0.875rem' }}>
                                        <i className="fas fa-align-left" style={{ marginRight: '8px', color: '#6366f1' }}></i>
                                        Bilingual Description
                                    </p>
                                    <div className="am-form-group">
                                        <label className="am-label">Description (English)</label>
                                        <textarea name="description_en" className="am-input" value={formData.description_en} onChange={handleInputChange} rows="2" placeholder="Brief summary in English..."></textarea>
                                    </div>
                                    <div className="am-form-group" style={{ marginBottom: 0 }}>
                                        <label className="am-label">Description (Telugu)</label>
                                        <textarea name="description_te" className="am-input" value={formData.description_te} onChange={handleInputChange} rows="2" placeholder="తెలుగులో సంక్షిప్త వివరణ..." style={{ fontFamily: 'serif' }}></textarea>
                                    </div>
                                </div>

                                {/* --- Slug & Section (Optional redirection) --- */}
                                <div className="am-form-row">
                                    <div className="am-form-group">
                                        <label className="am-label">Target Section (slug)</label>
                                        <input type="text" name="section" className="am-input" value={formData.section} onChange={handleInputChange} placeholder="e.g. academics, jobs" />
                                    </div>
                                    <div className="am-form-group">
                                        <label className="am-label">Target Article Slug</label>
                                        <input type="text" name="slug" className="am-input" value={formData.slug} onChange={handleInputChange} placeholder="e.g. kcr-it-policy" />
                                    </div>
                                </div>

                                {/* --- Category & Rank --- */}
                                <div className="am-form-row">
                                    <div className="am-form-group">
                                        <label className="am-label">Display Category (Label) *</label>
                                        <select name="category" className="am-input" value={formData.category} onChange={handleInputChange} required>
                                            <option value="">-- Select a Taxonomy Category --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="am-form-group">
                                        <label className="am-label">Display Rank (0 = first)</label>
                                        <input type="number" name="rank" className="am-input" value={formData.rank} onChange={handleInputChange} min="0" placeholder="0" />
                                    </div>
                                </div>

                                {/* --- Dates --- */}
                                <div className="am-form-row">
                                    <div className="am-form-group">
                                        <label className="am-label">Publish Date *</label>
                                        <input type="datetime-local" name="publish_date" className="am-input" value={formData.publish_date} onChange={handleInputChange} required />
                                    </div>
                                    <div className="am-form-group">
                                        <label className="am-label">Expiry Date (Optional)</label>
                                        <input type="datetime-local" name="expiry_date" className="am-input" value={formData.expiry_date} onChange={handleInputChange} />
                                    </div>
                                </div>

                                {/* --- Media Gallery Picker --- */}
                                <div className="am-form-group">
                                    <label className="am-label">
                                        <i className="fas fa-photo-video" style={{ marginRight: '8px', color: '#6366f1' }}></i>
                                        Media Gallery ({formData.media_ids.length} selected)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsMediaPickerOpen(true)}
                                        style={{
                                            width: '100%', padding: '1rem', border: '2px dashed #a5b4fc', borderRadius: '10px',
                                            background: '#eef2ff', color: '#4338ca', fontWeight: '600', fontSize: '0.9rem',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
                                        {formData.media_ids.length > 0
                                            ? `${formData.media_ids.length} media item(s) attached — Click to change`
                                            : 'Click to select images & videos from Media Library'}
                                    </button>
                                    {formData.media_ids.length > 0 && (
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                            IDs: {formData.media_ids.join(', ')}
                                        </p>
                                    )}
                                </div>

                            </div>
                            <div className="am-modal-footer">
                                <button type="button" className="am-btn-secondary" onClick={closeModal}>Discard</button>
                                <button type="submit" className="am-btn-primary" disabled={actionLoading}>
                                    {actionLoading
                                        ? <i className="fas fa-spinner fa-spin"></i>
                                        : editingStory ? 'Save Changes' : 'Publish Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Media Picker Sub-Modal --- */}
            {isMediaPickerOpen && (
                <MediaPickerModal
                    onClose={() => setIsMediaPickerOpen(false)}
                    onSelect={(ids) => setFormData(prev => ({ ...prev, media_ids: ids }))}
                    selectedIds={formData.media_ids}
                />
            )}
        </CMSLayout>
    );
};

export default TopStoriesManagement;
