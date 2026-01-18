import React, { useState, useEffect } from 'react';
import api, { updateUserNames as updateGlobalNames, updateUserStatus as updateGlobalStatus } from '../../services/api';
import API_CONFIG from '../../config/api.config';
import { useSnackbar } from '../../context/SnackbarContext';
import { getRoleInitials } from '../../utils/roleUtils';
import '../../styles/UserProfile.css';

const UserProfileSection = () => {
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        status: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.GET_PROFILE);
            setProfile(response.data);
            updateGlobalStatus(response.data.status);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            showSnackbar('Failed to load profile details', 'error');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
                firstName: profile.firstName,
                lastName: profile.lastName
            });

            // Update global context (Dashboard, Sidebar, Navbar)
            updateGlobalNames(profile.firstName, profile.lastName);

            showSnackbar('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showSnackbar(
                error.response?.data?.message || 'Failed to update profile',
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-section-container">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-section-container">
            <div className="profile-page-header">
                <h2 className="profile-page-title">Profile Management</h2>
                <div className="profile-page-divider"></div>
                <p className="profile-page-subtitle">Manage your account details and preferences</p>
            </div>

            <div className="profile-header">
                <div className="profile-avatar-large">
                    {getRoleInitials(profile.role)}
                </div>
                <div>
                    <div className="profile-name-row">
                        <h3 className="profile-name">
                            {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'My Profile'}
                        </h3>
                        <div className="status-indicator">
                            <span className={`status-dot ${profile.status ? 'active' : 'inactive'}`}></span>
                            <span style={{ color: profile.status ? '#059669' : '#dc2626' }}>
                                {profile.status ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <span className="profile-role-badge">{profile.role}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group full-width">
                    <label className="form-label">Email Address</label>
                    <input
                        type="email"
                        className="form-input"
                        value={profile.email}
                        disabled
                    />
                    <small style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        Email cannot be changed as it is your unique identifier.
                    </small>
                </div>

                <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        className="form-input"
                        value={profile.firstName || ''}
                        onChange={handleChange}
                        placeholder="Enter first name"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        className="form-input"
                        value={profile.lastName || ''}
                        onChange={handleChange}
                        placeholder="Enter last name"
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="save-profile-btn"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfileSection;
