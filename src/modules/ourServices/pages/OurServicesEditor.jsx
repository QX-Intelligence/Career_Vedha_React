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
    const [imageMap, setImageMap] = useState({}); // Maps local object URLs to S3 keys


    useEffect(() => {
        if (isEditMode) {
            const fetchService = async () => {
                try {
                    const data = await ourServicesService.getById(id);
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        content: data.content || ''
                    });
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
                    // Upload to get the real S3 key immediately
                    const key = await ourServicesService.uploadImage(file);
                    
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection();
                    
                    // Create a local blob URL for immediate preview
                    const localUrl = URL.createObjectURL(file);
                    
                    // Insert the local preview immediately so the user sees it
                    quill.insertEmbed(range.index, 'image', localUrl);
                    
                    // Store the mapping from temporary blob URL to real S3 key
                    setImageMap(prev => ({ ...prev, [localUrl]: key }));
                    
                    showSnackbar('Image uploaded successfully', 'success');
                } catch (error) {
                    showSnackbar('Image upload failed', 'error');
                }
            }
        };

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
            // Swap out temporary blob URLs with the actual S3 keys before saving
            let finalContent = formData.content;
            Object.entries(imageMap).forEach(([localUrl, key]) => {
                // Using split/join to replace all occurrences just in case
                finalContent = finalContent.split(localUrl).join(key);
            });

            const payload = { ...formData, content: finalContent };

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
