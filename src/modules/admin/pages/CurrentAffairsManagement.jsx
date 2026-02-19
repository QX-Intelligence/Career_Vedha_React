import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentAffairsService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config';
import { getUserContext } from '../../../services/api';
import LuxuryTooltip from '../../../components/ui/LuxuryTooltip';
import CustomSelect from '../../../components/ui/CustomSelect';
import './CurrentAffairsManagement.css';

const CurrentAffairsManagement = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { role: userRole } = getUserContext();

    const [affairs, setAffairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCmsOpen, setIsCmsOpen] = useState(true);
    const [cursorTime, setCursorTime] = useState(null);
    const [cursorId, setCursorId] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const LIMIT = 10;

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        description: '',
        region: 'AP',
        language: 'EN',
        file: null
    });

    const regions = [
        'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 
        'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 
        'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB', 'DL', 
        'JK', 'LA', 'PY', 'AN', 'CH', 'DN', 'DD', 'LD'
    ];
    const languages = [
        { value: 'EN', label: 'English' },
        { value: 'TE', label: 'Telugu' }
    ];

    const REGION_MAPPING = {
        // 'INDIA': 'India (National)',
        'AP': 'Andhra Pradesh',
        'AR': 'Arunachal Pradesh',
        'AS': 'Assam',
        'BR': 'Bihar',
        'CG': 'Chhattisgarh',
        'GA': 'Goa',
        'GJ': 'Gujarat',
        'HR': 'Haryana',
        'HP': 'Himachal Pradesh',
        'JH': 'Jharkhand',
        'KA': 'Karnataka',
        'KL': 'Kerala',
        'MP': 'Madhya Pradesh',
        'MH': 'Maharashtra',
        'MN': 'Manipur',
        'ML': 'Meghalaya',
        'MZ': 'Mizoram',
        'NL': 'Nagaland',
        'OD': 'Odisha',
        'PB': 'Punjab',
        'RJ': 'Rajasthan',
        'SK': 'Sikkim',
        'TN': 'Tamil Nadu',
        'TS': 'Telangana',
        'TR': 'Tripura',
        'UP': 'Uttar Pradesh',
        'UK': 'Uttarakhand',
        'WB': 'West Bengal',
        'DL': 'Delhi',
        'JK': 'Jammu and Kashmir',
        'LA': 'Ladakh',
        'PY': 'Puducherry',
        'AN': 'Andaman and Nicobar Islands',
        'CH': 'Chandigarh',
        'DN': 'Dadra and Nagar Haveli',
        'DD': 'Daman and Diu',
        'LD': 'Lakshadweep'
    };

    const regionOptions = regions.map(r => ({
        value: r,
        label: REGION_MAPPING[r] ? `${REGION_MAPPING[r]} (${r})` : r
    }));

    useEffect(() => {
        fetchAffairs(null, null, true);
    }, []);

    const fetchAffairs = async (cTime = null, cId = null, isFresh = false) => {
        try {
            setLoading(true);
            const params = { limit: LIMIT };
            // Don't filter by language in admin - show all entries
            if (cTime) params.cursorTime = cTime;
            if (cId) params.cursorId = cId;

            const response = await currentAffairsService.getAllAffairs(params);
            console.log('[Admin] Fetched affairs:', response);
            const data = Array.isArray(response) ? response : [];

            if (isFresh) {
                setAffairs(data);
            } else {
                setAffairs(prev => [...prev, ...data]);
            }

            if (data.length > 0) {
                const last = data[data.length - 1];
                setCursorTime(last.creationorupdationDate);
                setCursorId(last.id);
            }
            setHasMore(data.length === LIMIT);
        } catch (error) {
            console.error('[Admin] Error fetching affairs:', error);
            showSnackbar('Failed to fetch current affairs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setSelectedId(item.id);
            setFormData({
                title: item.title,
                summary: item.summary || '',
                description: item.description || '',
                region: item.region,
                language: item.language,
                file: null
            });
        } else {
            setIsEditing(false);
            setFormData({
                title: '',
                summary: '',
                description: '',
                region: 'INDIA',
                language: 'TE',
                file: null
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await currentAffairsService.updateCurrentAffair(selectedId, formData);
                showSnackbar('Current affair updated successfully', 'success');
            } else {
                await currentAffairsService.createCurrentAffairs(formData);
                showSnackbar('Current affair created successfully', 'success');
            }
            setShowModal(false);
            fetchAffairs(null, null, true);
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
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this current affair?')) return;
        try {
            await currentAffairsService.deleteCurrentAffair(id);
            showSnackbar('Deleted successfully', 'success');
            fetchAffairs(null, null, true);
        } catch (error) {
            console.error('Delete failed:', error);
            const errorData = error.response?.data;
            const errorMsg = errorData?.message || errorData?.error || (typeof errorData === 'string' ? errorData : null) || error.message || 'Failed to delete';
            showSnackbar('Failed to delete: ' + errorMsg, 'error');
        }
    };

    const checkAccess = (module) => checkAccessGlobal(userRole, module);

    const sidebarProps = {
        activeSection: 'current-affairs-management',
        checkAccess,
        MODULES,
        onLogout: () => navigate('/admin-login'),
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "Current Affairs Management",
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="current-affairs-mgmt-container">
                <div className="section-header">
                    <h3>Current Affairs Management</h3>
                    <button className="add-btn" onClick={() => handleOpenModal()}>
                        <i className="fas fa-plus"></i> Add New Entry
                    </button>
                </div>

                <div className="mgmt-table-container">
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Region</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}><div className="spinner"></div></td></tr>
                            ) : affairs.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No current affairs found.</td></tr>
                            ) : (
                                affairs.map(item => (
                                    <tr key={item.id}>
                                        <td><span style={{color:'#64748b', fontWeight:'600'}}>#{item.id}</span></td>
                                        <td style={{maxWidth: '300px', fontWeight: '600', color: '#1e293b'}}>{item.title}</td>
                                        <td><span className="region-badge">{item.region}</span></td>
                                        <td className="actions-cell">
                                            <LuxuryTooltip content="Edit">
                                                <button className="icon-btn edit" onClick={() => handleOpenModal(item)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </LuxuryTooltip>
                                            <LuxuryTooltip content="Delete">
                                                <button className="icon-btn delete" onClick={() => handleDelete(item.id)}>
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </LuxuryTooltip>
                                            {item.fileUrl && (
                                                <LuxuryTooltip content="View File">
                                                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="icon-btn view">
                                                        <i className="fas fa-external-link-alt"></i>
                                                    </a>
                                                </LuxuryTooltip>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {hasMore && (
                        <div style={{padding: '20px', textAlign: 'center'}}>
                            <button className="btn-secondary" onClick={() => fetchAffairs(cursorTime, cursorId)} disabled={loading}>
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Update Current Affair' : 'Create New Entry'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit} className="cms-form">
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        required
                                        placeholder="Enter news title..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Summary</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.summary}
                                        onChange={e => setFormData({...formData, summary: e.target.value})}
                                        placeholder="Brief summary..."
                                        style={{minHeight: '80px'}}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        placeholder="Detailed description..."
                                    />
                                </div>

                                <div className="form-group" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                    <CustomSelect
                                        label="Region"
                                        options={regionOptions}
                                        value={formData.region}
                                        onChange={val => setFormData({...formData, region: val})}
                                        placeholder="Select Region"
                                    />
                                    <div>
                                        <CustomSelect
                                            label="Language"
                                            options={languages}
                                            value={formData.language}
                                            onChange={val => setFormData({...formData, language: val})}
                                            placeholder="Select Language"
                                            disabled={isEditing}
                                        />
                                        {isEditing && <small style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px'}}>Cannot change language</small>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">File (Image/PDF/Doc)</label>
                                    <div className="file-input-wrapper">
                                        <label className="file-input-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <input
                                                type="file"
                                                onChange={e => setFormData({...formData, file: e.target.files[0]})}
                                                accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                style={{display: 'none'}}
                                            />
                                            {formData.file ? formData.file.name : 'Click to upload file'}
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? <div className="btn-spinner"></div> : (isEditing ? 'Update Entry' : 'Create Entry')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default CurrentAffairsManagement;
