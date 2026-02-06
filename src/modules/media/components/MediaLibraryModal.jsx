import React, { useState, useEffect, useRef, useCallback } from 'react';
import mediaService from '../../../services/mediaService';
import { useSnackbar } from '../../../context/SnackbarContext';
import './MediaLibraryModal.css';

const MediaLibraryModal = ({ isOpen, onClose, onSelect, targetType }) => {
    const { showSnackbar } = useSnackbar();
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [purpose, setPurpose] = useState(''); // Purpose filter

    const observer = useRef();
    const lastMediaElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNext) {
                fetchMedia(true);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasNext]);

    const fetchMedia = useCallback(async (loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setMediaItems([]);
            setNextCursor(null);
        }

        try {
            const params = {
                limit: 15,
                q: searchQuery.trim() || undefined,
                purpose: purpose || undefined,
                cursor: loadMore ? nextCursor : undefined
            };

            const data = await mediaService.list(params);
            const results = data.results || [];
            
            if (loadMore) {
                setMediaItems(prev => [...prev, ...results]);
            } else {
                setMediaItems(results);
            }
            
            setNextCursor(data.next_cursor);
            setHasNext(data.has_next);
        } catch (error) {
            console.error('Error fetching media library:', error);
            showSnackbar('Failed to load media library', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchQuery, purpose, nextCursor, showSnackbar]);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [isOpen, fetchMedia]);

    const handleSelect = (item) => {
        setSelectedId(item.id);
        onSelect(item.id, item.url);
    };

    if (!isOpen) return null;

    return (
        <div className="mlm-overlay" onClick={onClose}>
            <div className="mlm-container shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="mlm-header">
                    <div className="mlm-title-area">
                        <h3>
                            <i className="fas fa-images"></i> 
                            Select {targetType === 'banner' ? 'Banner' : 'Main'} Media
                        </h3>
                        <p>Pick an asset from your library</p>
                    </div>
                    <button className="mlm-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="mlm-controls">
                    <div className="mlm-search-box">
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Search by title..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
                        />
                    </div>
                    <select 
                        className="mlm-purpose-select"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                    >
                        <option value="">All Purposes</option>
                        <option value="article">Article</option>
                        <option value="banner">Banner</option>
                        <option value="general">General</option>
                    </select>
                </div>

                <div className="mlm-body">
                    {loading && mediaItems.length === 0 ? (
                        <div className="mlm-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Loading library...</p>
                        </div>
                    ) : mediaItems.length === 0 ? (
                        <div className="mlm-empty">
                            <i className="fas fa-folder-open"></i>
                            <p>No media icons found matching your search</p>
                        </div>
                    ) : (
                        <div className="mlm-grid">
                            {mediaItems.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    ref={index === mediaItems.length - 1 ? lastMediaElementRef : null}
                                    className={`mlm-card ${selectedId === item.id ? 'selected' : ''}`}
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className="mlm-preview">
                                        {item.media_type === 'video' ? (
                                            <video src={item.url} muted />
                                        ) : (
                                            <img src={item.url} alt={item.title} />
                                        )}
                                        {selectedId === item.id && (
                                            <div className="mlm-selected-overlay">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mlm-info">
                                        <span className="mlm-item-title">{item.title}</span>
                                        <span className="mlm-item-meta">
                                            {(item.media_type || 'unknown').toUpperCase()} • {item.purpose || 'general'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {loadingMore && (
                        <div className="mlm-loading-more">
                            <i className="fas fa-spinner fa-spin"></i>
                        </div>
                    )}
                </div>

                <div className="mlm-footer">
                    <button className="mlm-btn-cancel" onClick={onClose}>Cancel</button>
                    <button 
                        className="mlm-btn-select" 
                        disabled={!selectedId}
                        onClick={() => {
                            const selected = mediaItems.find(i => i.id === selectedId);
                            if (selected) onSelect(selected.id, selected.url, selected);
                        }}
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MediaLibraryModal;
