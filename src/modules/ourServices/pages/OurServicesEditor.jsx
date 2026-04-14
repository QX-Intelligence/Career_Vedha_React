import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ourServicesService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import '../../../styles/Dashboard.css';

const OurServicesEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const quillRef = useRef(null);
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: ''
    });
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);

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
                    const key = await ourServicesService.uploadImage(file);
                    
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection();
                    // We insert the KEY as the source. 
                    // The backend processHtml will swap this for a signed URL during GET.
                    quill.insertEmbed(range.index, 'image', key);
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
            if (isEditMode) {
                await ourServicesService.update(id, formData);
                showSnackbar('Service updated successfully', 'success');
            } else {
                await ourServicesService.create(formData);
                showSnackbar('Service created successfully', 'success');
            }
            navigate('/cms/our-services');
        } catch (error) {
            showSnackbar('Save failed. Please check your input.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Service...</div>;

    return (
        <div className="section-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
    );
};

export default OurServicesEditor;
