import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionPaperService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config';
import { getUserContext } from '../../../services/api';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import './PapersManagement.css';

const PapersManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { role: userRole } = getUserContext();

    const [activeTab, setActiveTab] = useState('QUESTIONPAPER');
    const [papers, setPapers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCmsOpen, setIsCmsOpen] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(false);
    const [selectedPapers, setSelectedPapers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state with file details
    const [showModal, setShowModal] = useState(false);
    const [fileDetails, setFileDetails] = useState([]);

    useEffect(() => {
        fetchPapers();
    }, [activeTab]);

    const fetchPapers = async () => {
        setIsLoading(true);
        try {
            const data = await questionPaperService.getPapersByCategory(activeTab, null, 100);
            setPapers(data);
        } catch (error) {
            console.error('Failed to fetch papers:', error);
            showSnackbar('Failed to load papers', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const details = files.map((file) => ({
            file: file,
            title: file.name.replace(/\.[^/.]+$/, ''), // Auto-extract but editable
            description: '',
            category: activeTab
        }));
        setFileDetails(details);
    };

    const updateFileDetail = (index, field, value) => {
        setFileDetails(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const removeFile = (index) => {
        setFileDetails(prev => prev.filter((_, i) => i !== index));
    };

    const handleBulkUpload = async () => {
        if (fileDetails.length === 0) {
            showSnackbar('Please select files to upload', 'error');
            return;
        }

        // Validate all files have titles
        const missingTitles = fileDetails.some(f => !f.title.trim());
        if (missingTitles) {
            showSnackbar('All files must have a title', 'error');
            return;
        }

        setUploadProgress(true);
        try {
            const formData = new FormData();
            
            // Backend expects: requests[0].file, requests[0].title, requests[0].category, requests[0].description
            fileDetails.forEach((detail, index) => {
                formData.append(`requests[${index}].file`, detail.file);
                formData.append(`requests[${index}].title`, detail.title);
                formData.append(`requests[${index}].category`, detail.category);
                formData.append(`requests[${index}].description`, detail.description || '');
            });

            await questionPaperService.bulkUploadPapers(formData);
            showSnackbar('Papers uploaded successfully!', 'success');
            setFileDetails([]);
            setShowModal(false);
            fetchPapers();
        } catch (error) {
            console.error('Upload failed:', error);
            const errorData = error.response?.data;
            let errorMsg = errorData?.message || errorData?.error || (typeof errorData === 'string' ? errorData : null) || error.message || 'Upload failed';
            
            // Helpful hint for true Network Errors during uploads
            if (error.message === 'Network Error' && !error.response) {
                errorMsg = 'Network Error: Possibly file too large or connection lost';
            }
            
            showSnackbar('Upload failed: ' + errorMsg, 'error');
        } finally {
            setUploadProgress(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedPapers.length === 0) {
            showSnackbar('Please select papers to delete', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedPapers.length} paper(s)?`)) {
            return;
        }

        try {
            await questionPaperService.deletePapers(selectedPapers);
            showSnackbar('Papers deleted successfully!', 'success');
            setSelectedPapers([]);
            fetchPapers();
        } catch (error) {
            console.error('Delete failed:', error);
            showSnackbar('Delete failed: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const handleDeleteSingle = async (paperId) => {
        if (!window.confirm('Delete this paper?')) return;
        try {
            await questionPaperService.deletePapers([paperId]);
            showSnackbar('Paper deleted!', 'success');
            fetchPapers();
        } catch (error) {
            console.error('Delete failed:', error);
            const errorData = error.response?.data;
            const errorMsg = errorData?.message || errorData?.error || (typeof errorData === 'string' ? errorData : null) || error.message || 'Delete failed';
            showSnackbar('Delete failed: ' + errorMsg, 'error');
        }
    };

    const togglePaperSelection = (paperId) => {
        setSelectedPapers(prev =>
            prev.includes(paperId)
                ? prev.filter(id => id !== paperId)
                : [...prev, paperId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPapers.length === filteredPapers.length) {
            setSelectedPapers([]);
        } else {
            setSelectedPapers(filteredPapers.map(p => p.id));
        }
    };

    const filteredPapers = papers.filter(paper =>
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paper.description && paper.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const checkAccess = (module) => checkAccessGlobal(userRole, module);

    const sidebarProps = {
        activeSection: 'papers-management',
        checkAccess,
        MODULES,
        onLogout: () => navigate('/admin-login'),
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "Previous Papers Management",
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="papers-mgmt-container">
                <div className="section-header">
                    <h3>Previous Papers & Study Materials</h3>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        <i className="fas fa-cloud-upload-alt"></i> Bulk Upload
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="category-tabs-bar">
                    <button
                        className={`tab-btn ${activeTab === 'QUESTIONPAPER' ? 'active' : ''}`}
                        onClick={() => setActiveTab('QUESTIONPAPER')}
                    >
                        <i className="fas fa-file-alt"></i> Question Papers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'MATERIAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('MATERIAL')}
                    >
                        <i className="fas fa-book"></i> Study Materials
                    </button>
                </div>

                {/* Search & Bulk Actions */}
                <div className="table-controls">
                    <div className="search-box-papers">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search papers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedPapers.length > 0 && (
                        <button onClick={handleDeleteSelected} className="delete-bulk-btn">
                            <i className="fas fa-trash"></i> Delete ({selectedPapers.length})
                        </button>
                    )}
                </div>

                {/* Papers Table */}
                <div className="mgmt-table-container">
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th style={{width: '50px'}}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPapers.length === filteredPapers.length && filteredPapers.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Upload Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}><div className="spinner"></div></td></tr>
                            ) : filteredPapers.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No {activeTab === 'QUESTIONPAPER' ? 'question papers' : 'study materials'} found.</td></tr>
                            ) : (
                                filteredPapers.map((paper) => (
                                    <tr key={paper.id} className={selectedPapers.includes(paper.id) ? 'selected-row' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedPapers.includes(paper.id)}
                                                onChange={() => togglePaperSelection(paper.id)}
                                            />
                                        </td>
                                        <td><span style={{color:'#64748b', fontWeight:'600'}}>#{paper.id}</span></td>
                                        <td style={{maxWidth: '300px', fontWeight: '600', color: '#1e293b'}}>
                                            <i className="fas fa-file-pdf" style={{color: '#dc3545', marginRight: '8px'}}></i>
                                            {paper.title}
                                        </td>
                                        <td style={{maxWidth: '200px', color: '#64748b', fontSize: '0.9rem'}}>{paper.description || '-'}</td>
                                        <td style={{color: '#64748b', fontSize: '0.875rem'}}>
                                            {new Date(paper.creationDate).toLocaleDateString()}
                                        </td>
                                        <td className="actions-cell">
                                            <LuxuryTooltip content="View PDF">
                                                <a
                                                    href={paper.presignedUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="icon-btn view"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </a>
                                            </LuxuryTooltip>
                                            <LuxuryTooltip content="Delete">
                                                <button
                                                    onClick={() => handleDeleteSingle(paper.id)}
                                                    className="icon-btn delete"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </LuxuryTooltip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="papers-count-footer">
                    Total: {filteredPapers.length} {activeTab === 'QUESTIONPAPER' ? 'question papers' : 'study materials'}
                </div>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bulk Upload {activeTab === 'QUESTIONPAPER' ? 'Question Papers' : 'Study Materials'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* File Selection */}
                            <div className="upload-area-modal">
                                <input
                                    type="file"
                                    id="fileInputModal"
                                    multiple
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    style={{display: 'none'}}
                                />
                                <label htmlFor="fileInputModal" className="file-upload-label">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <span>Choose PDF Files</span>
                                    <small>Click to select multiple files</small>
                                </label>
                            </div>

                            {/* File Details Form */}
                            {fileDetails.length > 0 && (
                                <div className="files-form-container">
                                    <h3 className="form-section-title">
                                        <i className="fas fa-edit"></i> Edit File Details ({fileDetails.length} files)
                                    </h3>
                                    <div className="files-list">
                                        {fileDetails.map((detail, index) => (
                                            <div key={index} className="file-detail-card">
                                                <div className="file-card-header">
                                                    <div className="file-info">
                                                        <i className="fas fa-file-pdf"></i>
                                                        <span className="file-name">{detail.file.name}</span>
                                                        <span className="file-size">
                                                            {(detail.file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="remove-file-btn"
                                                        title="Remove file"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                <div className="file-card-body">
                                                    <div className="form-group-inline">
                                                        <label className="form-label-inline">
                                                            Title <span className="required">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-input-inline"
                                                            value={detail.title}
                                                            onChange={(e) => updateFileDetail(index, 'title', e.target.value)}
                                                            placeholder="Enter paper title..."
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group-inline">
                                                        <label className="form-label-inline">Description</label>
                                                        <textarea
                                                            className="form-textarea-inline"
                                                            value={detail.description}
                                                            onChange={(e) => updateFileDetail(index, 'description', e.target.value)}
                                                            placeholder="Brief description (optional)..."
                                                            rows="2"
                                                        />
                                                    </div>
                                                    <div className="form-group-inline">
                                                        <label className="form-label-inline">Category</label>
                                                        <select
                                                            className="form-select-inline"
                                                            value={detail.category}
                                                            onChange={(e) => updateFileDetail(index, 'category', e.target.value)}
                                                        >
                                                            <option value="QUESTIONPAPER">Question Paper</option>
                                                            <option value="MATERIAL">Study Material</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                className="btn-primary"
                                onClick={handleBulkUpload}
                                disabled={fileDetails.length === 0 || uploadProgress}
                            >
                                {uploadProgress ? <div className="btn-spinner"></div> : <><i className="fas fa-upload"></i> Upload {fileDetails.length} File{fileDetails.length !== 1 ? 's' : ''}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default PapersManagement;
