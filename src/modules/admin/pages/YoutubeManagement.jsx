import React, { useState, useEffect, useCallback } from 'react';
import { youtubeService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import Skeleton from '../../../components/ui/Skeleton';
import './YoutubeManagement.css';

const YoutubeManagement = () => {
    const { showSnackbar } = useSnackbar();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('SHORT');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState({ title: '', url: '', category: 'SHORT' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await youtubeService.getYoutubeUrls(activeTab);
            setVideos(data);
        } catch (error) {
            showSnackbar('Failed to fetch YouTube URLs', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab, showSnackbar]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const handleOpenModal = (video = null) => {
        if (video) {
            setCurrentVideo(video);
            setIsEditing(true);
        } else {
            setCurrentVideo({ title: '', url: '', category: activeTab });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentVideo({ title: '', url: '', category: activeTab });
        setIsEditing(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentVideo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await youtubeService.updateYoutubeUrl(currentVideo);
                showSnackbar('YouTube URL updated successfully', 'success');
            } else {
                await youtubeService.createYoutubeUrls([currentVideo]);
                showSnackbar('YouTube URL created successfully', 'success');
            }
            fetchVideos();
            handleCloseModal();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} YouTube URL`;
            showSnackbar(errorMessage, 'error');
        }
    };

    const handleDelete = async (ids) => {
        if (!window.confirm(`Are you sure you want to delete ${ids.length} item(s)?`)) return;
        try {
            await youtubeService.deleteYoutubeUrls(ids);
            showSnackbar('YouTube URL(s) deleted successfully', 'success');
            setSelectedIds([]);
            fetchVideos();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete YouTube URL(s)';
            showSnackbar(errorMessage, 'error');
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === videos.length ? [] : videos.map(v => v.id));
    };

    return (
        <div className="youtube-management">
            <div className="management-header">
                <div className="header-info">
                    <h1>YouTube Management</h1>
                    <p>Manage YouTube Shorts and Long Videos for the platform</p>
                </div>
                <button className="add-btn" onClick={() => handleOpenModal()}>
                    <i className="fas fa-plus"></i> Add New Video
                </button>
            </div>

            <div className="management-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'SHORT' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SHORT')}
                >
                    Shorts
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'LONG' ? 'active' : ''}`}
                    onClick={() => setActiveTab('LONG')}
                >
                    Long Videos
                </button>
            </div>

            <div className="table-actions">
                <div className="selection-info">
                    {selectedIds.length > 0 && <span>{selectedIds.length} items selected</span>}
                </div>
                {selectedIds.length > 0 && (
                    <button className="bulk-delete-btn" onClick={() => handleDelete(selectedIds)}>
                        <i className="fas fa-trash"></i> Delete Selected
                    </button>
                )}
            </div>

            <div className="table-container shadow-sm">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input 
                                    type="checkbox" 
                                    checked={videos.length > 0 && selectedIds.length === videos.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Title</th>
                            <th>URL</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td colSpan="4"><Skeleton variant="text" width="100%" height="40px" /></td>
                                </tr>
                            ))
                        ) : videos.length > 0 ? (
                            videos.map((video) => (
                                <tr key={video.id} className={selectedIds.includes(video.id) ? 'selected' : ''}>
                                    <td className="checkbox-col">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(video.id)}
                                            onChange={() => toggleSelect(video.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="video-title-cell">
                                            <strong>{video.title}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-url-link">
                                            {video.url.substring(0, 50)}...
                                        </a>
                                    </td>
                                    <td className="actions-col">
                                        <div className="action-buttons">
                                            <button className="edit-action" onClick={() => handleOpenModal(video)}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="delete-action" onClick={() => handleDelete([video.id])}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="empty-row">No videos found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="management-modal-overlay">
                    <div className="management-modal slide-in-top">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit YouTube URL' : 'Add New YouTube URL'}</h2>
                            <button className="close-modal" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    value={currentVideo.title} 
                                    onChange={handleInputChange} 
                                    required 
                                    placeholder="Enter video title"
                                />
                            </div>
                            <div className="form-group">
                                <label>YouTube URL</label>
                                <input 
                                    type="url" 
                                    name="url" 
                                    value={currentVideo.url} 
                                    onChange={handleInputChange} 
                                    required 
                                    placeholder="https://youtube.com/..."
                                />
                                <small>Shorts or standard YouTube URLs are supported.</small>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select 
                                    name="category" 
                                    value={currentVideo.category} 
                                    onChange={handleInputChange}
                                >
                                    <option value="SHORT">Shorts</option>
                                    <option value="LONG">Long Video</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    {isEditing ? 'Update Video' : 'Add Video'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YoutubeManagement;
