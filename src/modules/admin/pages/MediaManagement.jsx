import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import CMSLayout from '../../../components/layout/CMSLayout';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import mediaService from '../../../services/mediaService';
import { useSnackbar } from '../../../context/SnackbarContext';
import { getUserContext } from '../../../services/api';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import '../../../styles/MediaManagement.css';
import '../../../styles/Dashboard.css';

const ResolvedMediaItem = ({ item }) => {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Only resolve for images and videos in the grid
        if (item.media_type === 'image' || item.media_type === 'video') {
            setLoading(true);
            mediaService.getPresigned(item.id)
                .then(data => {
                    if (data.presigned_url) {
                        setUrl(data.presigned_url);
                    } else {
                        setError(true);
                    }
                })
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        }
    }, [item.id, item.media_type]);

    const renderSkeleton = () => (
        <div className="mm-branded-skeleton">
            <div className="mm-skeleton-icon">
                <i className="fas fa-graduation-cap"></i>
            </div>
            <img src="/favicon.png" alt="Brand Logo" className="mm-preview-skeleton" />
        </div>
    );

    if (loading || error || !url) {
        return renderSkeleton();
    }

    if (item.media_type === 'video') {
        return (
            <video 
                src={url} 
                muted 
                autoPlay 
                loop 
                playsInline 
                className="mm-grid-preview-video"
            />
        );
    }

    if (item.media_type === 'image') {
        return (
            <img 
                src={url} 
                alt={item.title} 
                className="mm-grid-preview-image"
            />
        );
    }

    return renderSkeleton();
};

const MediaManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { role: userRole } = getUserContext();
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    // Filters
    const [purpose, setPurpose] = useState('');
    const [section, setSection] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Client-side filter for now

    // Pagination State
    const [page, setPage] = useState(1);
    const [allMedia, setAllMedia] = useState(() => {
        // Correct initialization from cache considering current filters
        try {
            const cached = queryClient.getQueryData(['media', '', '', 1]);
            return cached?.results || [];
        } catch (e) {
            return [];
        }
    });

    // Refs for tracking state across renders
    const isInitialMount = useRef(true);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Modal States
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Preview Modal State
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Replace Modal State
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [replaceItem, setReplaceItem] = useState(null);
    const [replacing, setReplacing] = useState(false);

    // Upload Form State
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPurpose, setUploadPurpose] = useState('article');
    const [uploadSection, setUploadSection] = useState('');
    const [detectedMediaType, setDetectedMediaType] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadAltText, setUploadAltText] = useState('');
    const [fileError, setFileError] = useState('');

    // Replace Form State
    const [replaceFile, setReplaceFile] = useState(null);
    const [replaceTitle, setReplaceTitle] = useState('');
    const [replaceAltText, setReplaceAltText] = useState('');
    const [replaceDetectedType, setReplaceDetectedType] = useState(null);
    const [replaceFileError, setReplaceFileError] = useState('');
    const [replaceCurrentPreviewUrl, setReplaceCurrentPreviewUrl] = useState(null);
    const [replaceCurrentLoading, setReplaceCurrentLoading] = useState(false);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        // Adjust allowed roles as per "PUBLISHER+" requirement from backend
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'CREATOR'];

        if (!isAuthenticated || !allowedRoles.includes(role)) {
            // navigate('/admin-login'); // Or unauthorized page
        }
    }, [navigate]);

    /* ================= MEDIA TYPE DETECTION ================= */
    const MEDIA_TYPE_EXTENSIONS = {
        image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
        pdf: ['.pdf'],
        doc: ['.doc', '.docx', '.txt', '.rtf'],
        video: ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    };

    const detectMediaType = (filename) => {
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        for (const [type, extensions] of Object.entries(MEDIA_TYPE_EXTENSIONS)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        return null;
    };

    const getAcceptedFileTypes = () => {
        return Object.values(MEDIA_TYPE_EXTENSIONS).flat().join(',');
    };

    /* ================= DATA FETCHING ================= */
    const { 
        data: mediaResponse, 
        isLoading, 
        isFetching,
        error,
        refetch
    } = useQuery({
        queryKey: ['media', purpose, section, page],
        queryFn: () => mediaService.list({ purpose, section, page, page_size: 20 }),
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    // Use a ref to prevent the reset effect from running on initial mount
    const isFirstMount = React.useRef(true);

    // Update media list when new data arrives
    useEffect(() => {
        if (mediaResponse?.results) {
            if (page === 1) {
                setAllMedia(mediaResponse.results);
            } else {
                setAllMedia(prev => {
                    // Prevent duplicate accumulation if effect runs twice
                    const existingIds = new Set(prev.map(i => i.id));
                    const newItems = mediaResponse.results.filter(i => !existingIds.has(i.id));
                    return [...prev, ...newItems];
                });
            }
            setTotalCount(mediaResponse.count || 0);
            setHasMore(!!mediaResponse.next);
        }
    }, [mediaResponse, page]);

    // Reset pagination ONLY when filters actually change
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setPage(1);
        // We DON'T setAllMedia([]) here anymore. 
        // This prevents the screen from going blank while waiting for the new page 1 data.
        // The data-sync useEffect below will naturally replace the list when the new data arrives.
        setHasMore(true);
    }, [purpose, section]);

    // Robust Data Derivation: Ensure we never flash "No data" if data exists in cache or state
    const currentResults = useMemo(() => {
        // If we are on page 1 and the query has fresh results, those are the most authoritative
        if (page === 1 && mediaResponse?.results && mediaResponse.results.length > 0) {
            return mediaResponse.results;
        }
        // Otherwise use our accumulated state
        return allMedia;
    }, [allMedia, mediaResponse?.results, page]);

    const filteredMedia = useMemo(() => {
        return currentResults.filter(item => 
            item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.file_key?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentResults, searchTerm]);

    /* ================= MUTATIONS ================= */
    const uploadMutation = useMutation({
        mutationFn: (formData) => mediaService.upload(formData),
        onSuccess: () => {
            showSnackbar('Media uploaded successfully!', 'success');
            queryClient.invalidateQueries(['media']);
            setShowUploadModal(false);
            resetUploadForm();
        },
        onError: (err) => {
            console.error('Upload Error:', err);
            showSnackbar(err.response?.data?.error || 'Failed to upload media', 'error');
        },
        onSettled: () => setUploading(false)
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => mediaService.delete(id),
        onSuccess: () => {
            showSnackbar('Media deleted successfully!', 'success');
            queryClient.invalidateQueries(['media']);
        },
        onError: (err) => {
            showSnackbar(err.response?.data?.error || 'Failed to delete media', 'error');
        }
    });

    const replaceMutation = useMutation({
        mutationFn: ({ id, formData }) => mediaService.replace(id, formData),
        onSuccess: (data, variables) => {
            const isFullReplacement = variables.formData.has('file');
            const message = isFullReplacement 
                ? `Media replaced successfully! New ID: ${data.media_id}`
                : 'Media details updated successfully!';
            
            showSnackbar(message, 'success');
            queryClient.invalidateQueries(['media']);
            setShowReplaceModal(false);
            resetReplaceForm();
        },
        onError: (err) => {
            console.error('Update Error:', err);
            showSnackbar(err.response?.data?.error || 'Failed to update media', 'error');
        },
        onSettled: () => setReplacing(false)
    });

    /* ================= HANDLERS ================= */
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileError('');
        const mediaType = detectMediaType(file.name);
        
        if (!mediaType) {
            setFileError(`Unsupported file format: ${file.name.substring(file.name.lastIndexOf('.'))}`);
            setUploadFile(null);
            setDetectedMediaType(null);
            e.target.value = ''; // Reset file input
            return;
        }

        setUploadFile(file);
        setDetectedMediaType(mediaType);
        if (!uploadTitle) {
            setUploadTitle(file.name);
        }
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!uploadFile) return showSnackbar('Please select a file', 'warning');
        if (!detectedMediaType) return showSnackbar('Invalid file type', 'error');

        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('purpose', uploadPurpose);
        if (uploadSection) formData.append('section', uploadSection);
        formData.append('media_type', detectedMediaType);
        formData.append('title', uploadTitle || uploadFile.name);
        formData.append('alt_text', uploadAltText);

        uploadMutation.mutate(formData);
    };

    const loadMoreMedia = () => {
        if (hasMore && !isLoading) {
            setPage(prev => prev + 1);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this media?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCopyUrl = async (id) => {
        try {
            const data = await mediaService.getPresigned(id);
            navigator.clipboard.writeText(data.presigned_url);
            showSnackbar('Presigned URL copied to clipboard!', 'success');
        } catch (err) {
            showSnackbar('Failed to get URL', 'error');
        }
    };

    const handleView = async (item) => {
        setPreviewItem(item);
        setPreviewLoading(true);
        setPreviewModalOpen(true);
        setPreviewUrl(null);

        try {
            const data = await mediaService.getPresigned(item.id);
            if (data.presigned_url) {
                setPreviewUrl(data.presigned_url);
            } else {
                showSnackbar('Could not resolve URL', 'error');
            }
        } catch (err) {
            showSnackbar('Failed to open media', 'error');
        } finally {
            setPreviewLoading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadFile(null);
        setUploadPurpose('article');
        setUploadSection('');
        setDetectedMediaType(null);
        setUploadTitle('');
        setUploadAltText('');
        setFileError('');
    };

    const resetReplaceForm = () => {
        setReplaceFile(null);
        setReplaceTitle('');
        setReplaceAltText('');
        setReplaceDetectedType(null);
        setReplaceFileError('');
        setReplaceItem(null);
        setReplaceCurrentPreviewUrl(null);
        setReplaceCurrentLoading(false);
    };

    const handleReplaceFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setReplaceFileError('');
        const mediaType = detectMediaType(file.name);
        
        if (!mediaType) {
            setReplaceFileError(`Unsupported file format: ${file.name.substring(file.name.lastIndexOf('.'))}`);
            setReplaceFile(null);
            setReplaceDetectedType(null);
            e.target.value = '';
            return;
        }

        setReplaceFile(file);
        setReplaceDetectedType(mediaType);
    };

    const handleReplace = (e) => {
        e.preventDefault();
        // If file is provided, it must be valid
        if (replaceFile && !replaceDetectedType) return showSnackbar('Invalid file type', 'error');
        if (!replaceItem) return;

        // Ensure at least one field is provided or changed
        const isMetadataChanged = replaceTitle !== replaceItem.title || replaceAltText !== (replaceItem.alt_text || '');
        if (!replaceFile && !isMetadataChanged) {
            return showSnackbar('No changes detected', 'info');
        }

        setReplacing(true);
        const formData = new FormData();
        if (replaceFile) {
            formData.append('file', replaceFile);
        }
        
        // Always append title/alt text if they exist
        if (replaceTitle) formData.append('title', replaceTitle);
        if (replaceAltText) formData.append('alt_text', replaceAltText);

        replaceMutation.mutate({ 
            id: replaceItem.id, 
            formData 
        });
    };

    const handleOpenReplace = async (item) => {
        setReplaceItem(item);
        setReplaceTitle(item.title);
        setReplaceAltText(item.alt_text || '');
        setReplaceCurrentPreviewUrl(null);
        setReplaceCurrentLoading(true);
        setShowReplaceModal(true);

        try {
            const data = await mediaService.getPresigned(item.id);
            if (data.presigned_url) {
                setReplaceCurrentPreviewUrl(data.presigned_url);
            }
        } catch (err) {
            console.error("Failed to fetch current media preview:", err);
        } finally {
            setReplaceCurrentLoading(false);
        }
    };

    const handleLogout = async () => {
          // Trigger logout
    };

     /* ================= GLOBAL SEARCH & LAYOUT PROPS ================= */
     // Reusing global search hooks if needed, or keeping it minimal
    const {
        query: globalQuery,
        results: globalResults,
        search: handleGlobalSearchInput,
        clearSearch: clearGlobalSearch,
        isSearching: isGlobalSearching,
        setIsSearching: setIsGlobalSearching
    } = useGlobalSearch();

    const handleGlobalSearch = (e) => handleGlobalSearchInput(e.target.value);

    // Simple navigation handler for search results
    const navigateToResult = (item) => {
       // handle navigation
       clearGlobalSearch();
    };

    const checkAccess = useCallback((module) => {
        return checkAccessGlobal(userRole, module);
    }, [userRole]);

    const sidebarProps = {
        activeSection: 'media', 
        checkAccess,
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "Media Library",
        searchQuery: globalQuery,
        handleSearch: handleGlobalSearch,
        showSearchResults: isGlobalSearching,
        searchResults: globalResults,
        navigateToResult: navigateToResult,
        setShowSearchResults: setIsGlobalSearching,
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="mm-header">
                <div className="mm-header-title">
                     <h1 className="mm-title">
                        <i className="fas fa-images"></i>
                        Media Library
                    </h1>
                     <p className="mm-subtitle">Manage images, documents, and videos</p>
                </div>
               
                <button className="mm-upload-btn" onClick={() => setShowUploadModal(true)}>
                    <i className="fas fa-cloud-upload-alt"></i>
                    Upload Media
                </button>
            </div>

            <div className="mm-controls">
                <div className="mm-filter-group">
                    <select 
                        className="mm-select"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                    >
                        <option value="">All Purposes</option>
                        <option value="article">Article</option>
                        <option value="academics">Academics</option>
                        <option value="jobs">Jobs</option>
                        <option value="general">General</option>
                    </select>

                    <input 
                        type="text" 
                        placeholder="Filter by section..." 
                        className="mm-input"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                    />
                    
                     <input 
                        type="text" 
                        placeholder="Search files..." 
                        className="mm-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginLeft: 'auto' }}
                    />
                </div>
            </div>


            {(isLoading || (isFetching && currentResults.length === 0)) && currentResults.length === 0 ? (
                <div className="um-loading">
                    <div className="um-spinner"></div>
                    <p>Loading media...</p>
                </div>
            ) : (
                <>
                    <div className="mm-grid">
                        {filteredMedia.length === 0 && !isLoading && !isFetching ? (
                            <div className="mm-empty">
                                <i className="fas fa-folder-open"></i>
                                <p>No media found</p>
                            </div>
                        ) : (
                            filteredMedia.map(item => (
                                <div key={item.id} className="mm-card">
                                    <div className="mm-media-wrapper" onClick={() => handleView(item)}>
                                        <ResolvedMediaItem item={item} />
                                        
                                        <div className="mm-glass-info">
                                            <h3 className="mm-card-title">{item.title}</h3>
                                            <div className="mm-meta">
                                                <span><i className="fas fa-fingerprint"></i> ID: {item.id}</span>
                                                <span><i className="fas fa-tag"></i> {item.purpose}</span>
                                                {/* Fix NaN KB issue by checking file_size */}
                                                <span><i className="fas fa-hdd"></i> {item.file_size ? (item.file_size / 1024).toFixed(1) : '0'} KB</span>
                                                <span><i className="fas fa-calendar"></i> {new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mm-actions-footer">
                                            <LuxuryTooltip content="View/Open">
                                            <button className="mm-action-btn view" onClick={() => handleView(item)}>
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            </LuxuryTooltip>
                                            <LuxuryTooltip content="Copy Link">
                                            <button className="mm-action-btn" onClick={() => handleCopyUrl(item.id)}>
                                                <i className="fas fa-link"></i>
                                            </button>
                                            </LuxuryTooltip>
                                            <LuxuryTooltip content="Replace Media">
                                            <button className="mm-action-btn replace" onClick={() => handleOpenReplace(item)}>
                                                <i className="fas fa-sync-alt"></i>
                                            </button>
                                            </LuxuryTooltip>
                                            <LuxuryTooltip content="Delete">
                                            <button className="mm-action-btn delete" onClick={() => handleDelete(item.id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                            </LuxuryTooltip>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>


                    {/* Pagination Controls */}
                    {filteredMedia.length > 0 && (
                        <div className="mm-pagination">
                            <div className="mm-pagination-info">
                                Showing {filteredMedia.length} of {totalCount} items
                            </div>
                            {hasMore && (
                                <button 
                                    className="mm-load-more-btn" 
                                    onClick={loadMoreMedia}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-chevron-down"></i>
                                            Load More
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Preview Modal */}
            {previewModalOpen && previewItem && (
                <div className="mm-modal-overlay preview-overlay">
                    <div className="mm-preview-modal">
                        <button className="mm-close-preview" onClick={() => setPreviewModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                        
                        {/* Media Metadata Sidebar */}
                        <div className="mm-preview-metadata">
                            <h3 className="mm-preview-title">
                                <i className="fas fa-info-circle"></i>
                                Media Information
                            </h3>
                            
                            <div className="mm-metadata-grid">
                                <div className="mm-metadata-item">
                                    <label><i className="fas fa-heading"></i> Title</label>
                                    <span>{previewItem.title}</span>
                                </div>
                                
                                <div className="mm-metadata-item">
                                    <label><i className="fas fa-file-alt"></i> Media Type</label>
                                    <span className="mm-badge mm-badge-type">{previewItem.media_type.toUpperCase()}</span>
                                </div>
                                
                                <div className="mm-metadata-item">
                                    <label><i className="fas fa-tag"></i> Purpose</label>
                                    <span className="mm-badge mm-badge-purpose">{previewItem.purpose}</span>
                                </div>
                                
                                {previewItem.section && (
                                    <div className="mm-metadata-item">
                                        <label><i className="fas fa-folder"></i> Section</label>
                                        <span>{previewItem.section}</span>
                                    </div>
                                )}
                                
                                <div className="mm-metadata-item">
                                    <label><i className="fas fa-hdd"></i> File Size</label>
                                    <span>{previewItem.file_size ? (previewItem.file_size / 1024).toFixed(2) : '0'} KB</span>
                                </div>
                                
                                <div className="mm-metadata-item">
                                    <label><i className="fas fa-calendar"></i> Uploaded</label>
                                    <span>{new Date(previewItem.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}</span>
                                </div>
                                
                                {previewItem.alt_text && (
                                    <div className="mm-metadata-item mm-metadata-full">
                                        <label><i className="fas fa-comment-alt"></i> Alt Text</label>
                                        <span>{previewItem.alt_text}</span>
                                    </div>
                                )}
                                
                                <div className="mm-metadata-item mm-metadata-full">
                                    <label><i className="fas fa-link"></i> File Key</label>
                                    <span className="mm-file-key">{previewItem.file_key}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mm-preview-content">
                            {previewLoading ? (
                                <div className="um-loading">
                                    <div className="um-spinner"></div>
                                    <p>Resolving Media...</p>
                                </div>
                            ) : previewUrl ? (
                                <>
                                    {previewItem.media_type === 'pdf' ? (
                                        /* Defaulting to iframe for PDFs to avoid S3 CORS console errors from react-pdf fetch */
                                        <div className="mm-iframe-container" style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                                            <iframe src={previewUrl} title={previewItem.title} className="mm-media-iframe" />
                                        </div>
                                    ) : previewItem.media_type === 'video' ? (
                                        <video controls autoPlay src={previewUrl} className="mm-media-view" />
                                    ) : previewItem.media_type === 'image' ? (
                                        <img src={previewUrl} alt={previewItem.title} className="mm-media-view" />
                                    ) : (
                                        <div className="mm-iframe-container" style={{width: '100%', height: '100%'}}>
                                            <iframe src={previewUrl} title={previewItem.title} className="mm-media-iframe" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="mm-error">Could not load media.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="mm-modal-overlay">
                    <div className="mm-modal">
                        <div className="mm-modal-header">
                            <h3>Upload New Media</h3>
                            <button className="mm-modal-close" onClick={() => setShowUploadModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="mm-modal-body">
                                <div className="mm-form-group">
                                    <label>Select File</label>
                                    <input 
                                        type="file" 
                                        className="mm-file-input"
                                        accept={getAcceptedFileTypes()}
                                        onChange={handleFileSelect}
                                        required 
                                    />
                                    {fileError && (
                                        <div style={{color: '#ff4444', fontSize: '0.85rem', marginTop: '0.5rem'}}>
                                            <i className="fas fa-exclamation-circle"></i> {fileError}
                                        </div>
                                    )}
                                    {detectedMediaType && (
                                        <div style={{color: '#4CAF50', fontSize: '0.85rem', marginTop: '0.5rem'}}>
                                            <i className="fas fa-check-circle"></i> Detected type: <strong>{detectedMediaType.toUpperCase()}</strong>
                                        </div>
                                    )}
                                </div>
                                <div className="mm-form-group">
                                    <label>Title</label>
                                    <input 
                                        type="text" 
                                        className="mm-input" 
                                        style={{width: '100%'}}
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        placeholder="Optional (defaults to filename)"
                                    />
                                </div>
                                
                                <div style={{display: 'flex', gap: '1rem'}}>
                                     <div className="mm-form-group" style={{flex: 1}}>
                                        <label>Purpose</label>
                                        <select 
                                            className="mm-select"
                                            style={{width: '100%'}}
                                            value={uploadPurpose}
                                            onChange={(e) => setUploadPurpose(e.target.value)}
                                        >
                                            <option value="article">Article</option>
                                            <option value="academics">Academics</option>
                                            <option value="jobs">Jobs</option>
                                            <option value="general">General</option>
                                        </select>
                                    </div>
                                    <div className="mm-form-group" style={{flex: 1}}>
                                        <label>Section (Optional)</label>
                                        <input 
                                            type="text" 
                                            className="mm-input" 
                                            style={{width: '100%'}}
                                            value={uploadSection}
                                            onChange={(e) => setUploadSection(e.target.value)}
                                            placeholder="e.g. hero-banner"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mm-modal-footer">
                                <button type="button" className="mm-btn-cancel" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="mm-btn-save" 
                                    disabled={uploading || !uploadFile}
                                    title={!uploadFile ? "Please select a file to upload" : ""}
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Replace Modal */}
            {showReplaceModal && replaceItem && (
                <div className="mm-modal-overlay">
                    <div className="mm-modal">
                        <div className="mm-modal-header">
                            <h3>Replace Media (ID: {replaceItem.id})</h3>
                            <button className="mm-modal-close" onClick={() => setShowReplaceModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleReplace}>
                            <div className="mm-modal-body">
                                <div className="mm-info-box" style={{
                                    background: 'rgba(250, 204, 21, 0.1)',
                                    border: '1px solid var(--primary-yellow)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--slate-700)',
                                    display: 'flex',
                                    gap: '1.25rem',
                                    alignItems: 'center'
                                }}>
                                    {replaceCurrentLoading ? (
                                        <div style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            borderRadius: '8px', 
                                            background: 'rgba(0,0,0,0.05)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            flexShrink: 0 
                                        }}>
                                            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-yellow)' }}></i>
                                        </div>
                                    ) : replaceCurrentPreviewUrl ? (
                                        <div style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            borderRadius: '8px', 
                                            overflow: 'hidden', 
                                            flexShrink: 0, 
                                            border: '2px solid white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            background: '#f8fafc'
                                        }}>
                                            {replaceItem.media_type === 'image' && (
                                                <img src={replaceCurrentPreviewUrl} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                            {replaceItem.media_type === 'video' && (
                                                <video src={replaceCurrentPreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                            {replaceItem.media_type === 'pdf' && (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2' }}>
                                                    <i className="fas fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
                                                </div>
                                            )}
                                            {['doc', 'other'].includes(replaceItem.media_type) && (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <i className="fas fa-file-alt" style={{ color: '#64748b', fontSize: '1.5rem' }}></i>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <i className="fas fa-info-circle" style={{color: 'var(--primary-yellow)'}}></i>
                                            <span style={{ fontWeight: 700 }}>Replacing Existing Media</span>
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--slate-900)' }}>{replaceItem.title}</div>
                                        <div style={{ opacity: 0.8, fontSize: '0.8rem', marginTop: '4px' }}>
                                            <i className="fas fa-tag"></i> {replaceItem.purpose} 
                                            {replaceItem.section && ` • ${replaceItem.section}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="mm-form-group">
                                    <label>Select New File (Optional)</label>
                                    <input 
                                        type="file" 
                                        className="mm-file-input"
                                        accept={getAcceptedFileTypes()}
                                        onChange={handleReplaceFileSelect}
                                    />
                                    {replaceFileError && (
                                        <div style={{color: '#ff4444', fontSize: '0.85rem', marginTop: '0.5rem'}}>
                                            <i className="fas fa-exclamation-circle"></i> {replaceFileError}
                                        </div>
                                    )}
                                    {replaceDetectedType && (
                                        <div style={{color: '#4CAF50', fontSize: '0.85rem', marginTop: '0.5rem'}}>
                                            <i className="fas fa-check-circle"></i> Detected type: <strong>{replaceDetectedType.toUpperCase()}</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="mm-form-group">
                                    <label>Title (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="mm-input" 
                                        style={{width: '100%'}}
                                        value={replaceTitle}
                                        onChange={(e) => setReplaceTitle(e.target.value)}
                                        placeholder={`Defaults to: ${replaceItem.title}`}
                                    />
                                </div>

                                <div className="mm-form-group">
                                    <label>Alt Text (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="mm-input" 
                                        style={{width: '100%'}}
                                        value={replaceAltText}
                                        onChange={(e) => setReplaceAltText(e.target.value)}
                                        placeholder={`Defaults to: ${replaceItem.alt_text || 'current alt text'}`}
                                    />
                                </div>
                            </div>
                            <div className="mm-modal-footer">
                                <button type="button" className="mm-btn-cancel" onClick={() => setShowReplaceModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="mm-btn-save" 
                                    disabled={replacing}
                                >
                                    {replacing ? 'Updating...' : 'Update Media'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default MediaManagement;
