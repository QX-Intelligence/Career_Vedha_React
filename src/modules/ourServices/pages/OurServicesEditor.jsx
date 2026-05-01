import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../../../components/ui/RichTextEditor';
import { ourServicesService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import CMSLayout from '../../../components/layout/CMSLayout';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import { getUserContext, logout } from '../../../services/api';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';

import '../../../styles/Dashboard.css';
import '../../../styles/ArticleManagement.css';

/**
 * Utility to extract the S3 Key from a signed AWS URL.
 */
const extractKeyFromS3Url = (url) => {
    if (!url || !url.includes('amazonaws.com')) return url;
    try {
        const urlObj = new URL(url);
        return decodeURIComponent(urlObj.pathname.slice(1));
    } catch (e) {
        return url;
    }
};

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
    const [imageMap, setImageMap] = useState({}); // Maps local Base64 URLs to backend keys
    const [uploadedImages, setUploadedImages] = useState([]); // Tracks images for gallery/deletion
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);


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
                    
                    // Extract rendered image URLs to populate the gallery safely
                    if (htmlContent) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(htmlContent, 'text/html');
                            const extractedImgs = Array.from(doc.querySelectorAll('img')).map(img => {
                                const src = img.getAttribute('src');
                                return {
                                    previewUrl: src, // Use the signed URL for preview
                                    serverKey: extractKeyFromS3Url(src) // Extract the real key for deletion/saving
                                };
                            });
                            if (extractedImgs.length > 0) {
                                setUploadedImages(extractedImgs);
                                // Also populate imageMap so we can swap them back to keys on save if they are edited
                                const initialMap = {};
                                extractedImgs.forEach(img => {
                                    if (img.previewUrl !== img.serverKey) {
                                        initialMap[img.previewUrl] = img.serverKey;
                                    }
                                });
                                setImageMap(initialMap);
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
        input.style.display = 'none'; // Hide it
        document.body.appendChild(input); // Append to DOM to prevent Garbage Collection during upload

        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                // Proactively prevent files larger than 10MB from being uploaded
                if (file.size > 10 * 1024 * 1024) {
                    showSnackbar('File size exceeds the maximum limit of 10MB. Please choose a smaller image.', 'warning');
                    document.body.removeChild(input); // Clean up
                    return;
                }
                
                try {
                    setIsUploading(true);
                    setUploadProgress(0);
                    showSnackbar('Uploading image...', 'info');
                    
                    // Upload to get the real S3 URL immediately
                    const serverKey = await ourServicesService.uploadImage(file, 'services', (progress) => {
                        setUploadProgress(progress);
                    });
                    
                    // Generate local blob url
                    const localUrl = URL.createObjectURL(file);
                    
                    const editorProxy = quillRef.current;
                    let range = editorProxy.getSelection();
                    if (!range) {
                        range = { index: editorProxy.getLength() };
                    }
                    
                    // Insert the local preview using the TipTap-shim method
                    editorProxy.insertEmbed(range.index, 'image', localUrl);
                    
                    // Map local URL to real backend URL so we can swap it out upon saving
                    setImageMap(prev => ({ ...prev, [localUrl]: serverKey }));
                    
                    // Add to uploaded images gallery
                    setUploadedImages(prev => {
                        if (!prev.find(img => img.serverKey === serverKey)) {
                            return [...prev, { previewUrl: localUrl, serverKey: serverKey }];
                        }
                        return prev;
                    });
                    
                    showSnackbar('Image uploaded successfully', 'success');
                } catch (error) {
                    console.error('Upload error:', error);
                    const backendMsg = error.message || error.response?.data?.message || error.response?.data?.error;
                    showSnackbar(backendMsg ? `Upload failed: ${backendMsg}` : 'Image upload failed. Please check file size and type.', 'error');
                } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                    // Clean up the DOM node after everything is done
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                }
            } else {
                // Clean up if user cancels the file dialog
                document.body.removeChild(input);
            }
        };
    };

    const handleDeleteUploadedImage = async (serverKey) => {
        if (window.confirm("Are you sure you want to delete this image? It will be removed from S3 permanently.")) {
            try {
                // Delete from Backend/S3
                await ourServicesService.deleteImage(serverKey);
                
                // Remove from gallery state
                setUploadedImages(prev => prev.filter(img => img.serverKey !== serverKey));
                
                // Also remove from imageMap so it doesn't get swapped on saving if user re-adds
                const localBase64Obj = Object.entries(imageMap).find(([b64, key]) => key === serverKey);
                if (localBase64Obj) {
                    setImageMap(prev => {
                        const newMap = { ...prev };
                        delete newMap[localBase64Obj[0]];
                        return newMap;
                    });
                }
                
                // Remove from Editor Content manually to avoid orphaned tags
                const parser = new DOMParser();
                const doc = parser.parseFromString(formData.content, 'text/html');
                // Target both literal matches (like base64 or relative URIs)
                let imgs = doc.querySelectorAll(`img[src="${serverKey}"]`);
                if (imgs.length === 0 && localBase64Obj) {
                    imgs = doc.querySelectorAll(`img[src="${localBase64Obj[0]}"]`);
                }
                if (imgs.length > 0) {
                    imgs.forEach(img => img.remove());
                    setFormData(prev => ({ ...prev, content: doc.body.innerHTML }));
                }
                
                showSnackbar('Image deleted successfully', 'success');
            } catch (error) {
                const backendMsg = error.response?.data?.message || error.response?.data?.error;
                showSnackbar(backendMsg || 'Failed to delete image. It may have already been deleted.', 'error');
            }
        }
    };



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
            
            // 1. Replace local blob URLs with S3 keys
            Object.entries(imageMap).forEach(([localUrl, serverKey]) => {
                finalContent = finalContent.split(localUrl).join(serverKey);
            });

            // 2. CLEANUP: If existing images have signed URLs (loaded from backend), 
            // we should ideally keep them as keys. However, since the backend processes 
            // them automatically on retrieval, saving them back as full URLs would be 
            // redundant or potentially save expired links. 
            // The backend processHtml only replaces keys that ARE NOT http, so we are safe 
            // as long as we only upload keys.
            
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
            const backendMsg = error.response?.data?.message || error.response?.data?.error;
            showSnackbar(backendMsg || 'Save failed. Please check your input.', 'error');
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
        onLogout: logout,
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
                    <label className="am-label">Service Content (Rich Text) * <span style={{fontSize: '12px', color: 'var(--slate-500)', fontWeight: 'normal', marginLeft: '10px'}}>(Max image size: 10MB)</span></label>
                    {isUploading && (
                        <div style={{ marginBottom: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--slate-700)' }}>
                                <span>Uploading Image...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ width: `${uploadProgress}%`, background: '#3b82f6', height: '100%', transition: 'width 0.2s ease' }}></div>
                            </div>
                        </div>
                    )}
                    <div className="quill-wrapper" style={{ minHeight: '400px', background: 'white' }}>
                        <RichTextEditor
                            ref={quillRef}
                            value={formData.content}
                            onChange={handleEditorChange}
                            customImageHandler={imageHandler}
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
                            {uploadedImages.map((imgObj, index) => (
                                <div key={index} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: 'white' }}>
                                    <img src={imgObj.previewUrl} alt={`Uploaded ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteUploadedImage(imgObj.serverKey)}
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
