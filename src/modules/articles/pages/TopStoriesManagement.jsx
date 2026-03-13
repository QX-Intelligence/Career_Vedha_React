import React, { useState, useEffect } from 'react';
import { newsService } from '../../../services';
import './TopStoriesManagement.css';
import { useSnackbar } from '../../../context/SnackbarContext';

const TopStoriesManagement = () => {
    const { showSnackbar } = useSnackbar();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStory, setEditingStory] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        publish_date: '',
        expiry_date: '',
        rank: 0,
        image_url: ''
    });

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            setLoading(true);
            const data = await newsService.getTopStoriesList();
            setStories(data.results || data);
        } catch (error) {
            showSnackbar('Failed to fetch top stories');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, file: e.target.files[0] }));
        }
    };

    const openModal = (story = null) => {
        if (story) {
            setEditingStory(story);
            setFormData({
                title: story.title || '',
                description: story.description || '',
                category: story.category || '',
                publish_date: story.publish_date ? story.publish_date.substring(0, 16) : '',
                expiry_date: story.expiry_date ? story.expiry_date.substring(0, 16) : '',
                rank: story.rank || 0,
                image_url: story.image_url || ''
            });
        } else {
            setEditingStory(null);
            setFormData({
                title: '',
                description: '',
                category: '',
                publish_date: '',
                expiry_date: '',
                rank: 0,
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataPayload = new FormData();
            
            // Required fields
            dataPayload.append('title', formData.title);
            dataPayload.append('description', formData.description || '');
            dataPayload.append('category', formData.category || 'HOT_TOPIC');
            dataPayload.append('is_top_story', 'true');

            // Image
            if (formData.file) {
                dataPayload.append('image_file', formData.file);
            } else if (formData.image_url) {
                dataPayload.append('image_url', formData.image_url);
            }

            if (editingStory) {
                await newsService.updateTopStory(editingStory.id, dataPayload);
                showSnackbar('Top story updated successfully!');
            } else {
                await newsService.createTopStory(dataPayload);
                showSnackbar('Top story created successfully!');
            }
            setIsModalOpen(false);
            fetchStories();
        } catch (error) {
            showSnackbar(editingStory ? 'Failed to update story' : 'Failed to create story');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this story?')) {
            try {
                await newsService.deleteTopStory(id);
                showSnackbar('Story deleted successfully');
                fetchStories();
            } catch (error) {
                showSnackbar('Failed to delete story');
            }
        }
    };

    return (
        <div className="top-stories-container">
            <div className="header-actions">
                <h2>Manage Top Stories</h2>
                <button className="primary-btn" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i> Add Top Story
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <div className="stories-grid">
                    {stories.map(story => (
                        <div key={story.id} className="story-card">
                            {story.image_url && <img src={story.image_url} alt={story.title} className="story-img" />}
                            <div className="story-content">
                                <h3>{story.title}</h3>
                                <p className="category-tag">{story.category}</p>
                                <p className="dates">
                                    <i className="far fa-clock"></i> {new Date(story.publish_date).toLocaleDateString()}
                                </p>
                                <div className="card-actions">
                                    <button className="icon-btn edit" onClick={() => openModal(story)}>
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(story.id)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingStory ? 'Edit Top Story' : 'New Top Story'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <input type="text" name="category" value={formData.category} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Rank (Priority)</label>
                                    <input type="number" name="rank" value={formData.rank} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Publish Date</label>
                                    <input type="datetime-local" name="publish_date" value={formData.publish_date} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="datetime-local" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Cover Image</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                {formData.image_url && !formData.file && (
                                    <div className="current-image-preview">
                                        <img src={formData.image_url} alt="Current" />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">{editingStory ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopStoriesManagement;
