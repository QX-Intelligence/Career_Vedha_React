import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ourServicesService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import CMSLayout from '../../../components/layout/CMSLayout';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import { getUserContext } from '../../../services/api';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';

import '../../../styles/Dashboard.css';

const OurServicesEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { role: userRole } = getUserContext();
    const quillRef = useRef(null);
    const isEditMode = !!id;
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: ''
    });
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]); // Tracks images for gallery/deletion


    useEffect(() => {
        if (isEditMode) {
            const fetchService = async () => {
                try {
                    const data = await ourServicesService.getById(id);
                    const htmlContent = data.content || '';
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        content: htmlContent
                    });
                    
                    // Extract rendered image URLs to populate the gallery
                    if (htmlContent) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(htmlContent, 'text/html');
                            const imgs = Array.from(doc.querySelectorAll('img')).map(img => img.src);
                            if (imgs.length > 0) {
                                setUploadedImages(imgs);
                            }
                        } catch(e) {
                            console.error('Failed to parse images', e);
                        }
                    }
                } catch (error) {
                    showSnackbar('Failed to load service data', 'error');
                    navigate('/cms/our-services');
                } finally {
                    setLoading(false);
                }
            };
            fetchService();
        }
    }, [id, isEditMode, navigate, showSnackbar]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
    };

    // Custom Image Handler for ReactQuill
    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                try {
                    showSnackbar('Uploading image...', 'info');
                    // Upload to get the real S3 URL immediately
                    const url = await ourServicesService.uploadImage(file);
                    
                    const quill = quillRef.current.getEditor();
                    let range = quill.getSelection();
                    if (!range) {
                        range = { index: quill.getLength() };
                    }
                    
                    // Insert the uploaded URL directly so we avoid unsafe:blob issues
                    quill.insertEmbed(range.index, 'image', url);
                    
                    // Add to uploaded images gallery
                    setUploadedImages(prev => {
                        if (!prev.includes(url)) return [...prev, url];
                        return prev;
                    });
                    
                    showSnackbar('Image uploaded successfully', 'success');
                } catch (error) {
                    showSnackbar('Image upload failed', 'error');
                }
            }
        };

    };

    const handleDeleteUploadedImage = async (url) => {
        if (window.confirm("Are you sure you want to delete this image? It will be removed from S3 permanently.")) {
            try {
                // Delete from Backend/S3
                await ourServicesService.deleteImage(url);
                
                // Remove from gallery state
                setUploadedImages(prev => prev.filter(img => img !== url));
                
                // Remove from Editor Content manually to avoid orphaned tags
                const parser = new DOMParser();
                const doc = parser.parseFromString(formData.content, 'text/html');
                const imgs = doc.querySelectorAll(`img[src="${url}"]`);
                if (imgs.length > 0) {
                    imgs.forEach(img => img.remove());
                    setFormData(prev => ({ ...prev, content: doc.body.innerHTML }));
                }
                
                showSnackbar('Image deleted successfully', 'success');
            } catch (error) {
                showSnackbar('Failed to delete image. It may have already been deleted.', 'error');
            }
        }
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            showSnackbar('Title and Content are required', 'warning');
            return;
        }

        setSaving(true);
        try {
            // Use the actual content since we inserted real URLs instead of blob URLs
            const payload = { ...formData };

            if (isEditMode) {
                await ourServicesService.update(id, payload);
                showSnackbar('Service updated successfully', 'success');
            } else {
                await ourServicesService.create(payload);
                showSnackbar('Service created successfully', 'success');
            }
            navigate('/cms/our-services');

        } catch (error) {
            showSnackbar('Save failed. Please check your input.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const {
        query: globalSearchQuery,
        results: globalSearchResults,
        search: handleGlobalSearchInput,
        clearSearch: clearGlobalSearch,
        isSearching: showGlobalSearchResults,
        setIsSearching: setShowGlobalSearchResults
    } = useGlobalSearch();

    const handleGlobalSearch = (e) => {
        handleGlobalSearchInput(e.target.value);
    };

    const navigateToGlobalResult = (item) => {
        navigate(`/dashboard?tab=${item.section}`);
        clearGlobalSearch();
    };

    const checkAccess = useCallback((module) => {
        return checkAccessGlobal(userRole, module);
    }, [userRole]);

    const sidebarProps = {
        activeSection: 'services-management',
        checkAccess,
        MODULES,
        onLogout: () => navigate('/admin-login'),
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: isEditMode ? 'Edit Service' : 'Create New Service',
        searchQuery: globalSearchQuery,
        handleSearch: handleGlobalSearch,
        showSearchResults: showGlobalSearchResults,
        searchResults: globalSearchResults,
        navigateToResult: navigateToGlobalResult,
        setShowSearchResults: setShowGlobalSearchResults,
        onProfileClick: () => navigate('/dashboard?tab=profile'),
        showBack: true,
        onBack: () => navigate('/cms/our-services')
    };

    if (loading) return <div className="p-8 text-center">Loading Service...</div>;

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-edit"></i>
                        {isEditMode ? 'Edit Service' : 'Create New Service'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-section" style={{ padding: '2rem', borderRadius: '16px', background: 'white', border: '1px solid var(--slate-200)' }}>
                <div className="am-form-group">
                    <label className="am-label">Service Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter catchy service title..."
                        className="am-input"
                        required
                    />
                </div>

                <div className="am-form-group">
                    <label className="am-label">Short Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief summary of the service..."
                        className="am-input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                </div>

                <div className="am-form-group">
                    <label className="am-label">Service Content (Rich Text) *</label>
                    <div className="quill-wrapper" style={{ minHeight: '400px', background: 'white' }}>
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={formData.content}
                            onChange={handleEditorChange}
                            modules={modules}
                            placeholder="Describe your service in detail. You can add images, links, and formatting..."
                            style={{ height: '350px', marginBottom: '50px' }}
                        />
                    </div>
                </div>

                {uploadedImages.length > 0 && (
                    <div className="am-form-group" style={{ marginTop: '20px' }}>
                        <label className="am-label" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--slate-700)', display: 'block', marginBottom: '10px' }}>
                            <i className="fas fa-images"></i> Manage Uploaded Images
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '15px' }}>Images inserted into the editor are shown here. Click the delete icon to permanently remove an image from S3.</p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {uploadedImages.map((url, index) => (
                                <div key={index} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: 'white' }}>
                                    <img src={url} alt={`Uploaded ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteUploadedImage(url)}
                                        style={{ position: 'absolute', top: '5px', right: '5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                                        title="Delete from Editor & S3"
                                    >
                                        <i className="fas fa-trash-alt" style={{ fontSize: '10px' }}></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="am-modal-footer" style={{ background: 'transparent', padding: '1rem 0 0 0', border: 'none' }}>
                    <button type="button" className="am-btn-secondary" onClick={() => navigate('/cms/our-services')}>
                        Cancel
                    </button>
                    <button type="submit" className="am-btn-primary" disabled={saving}>
                        {saving ? (
                            <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                        ) : (
                            <><i className="fas fa-save"></i> {isEditMode ? 'Update' : 'Create'} Service</>
                        )}
                    </button>
                </div>
            </form>
            </div>
        </CMSLayout>
    );
};

export default OurServicesEditor;
