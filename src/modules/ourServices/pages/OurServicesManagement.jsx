import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ourServicesService } from '../../../services';
import { useSnackbar } from '../../../context/SnackbarContext';
import Skeleton, { SkeletonTable } from '../../../components/ui/Skeleton';
import CMSLayout from '../../../components/layout/CMSLayout';
import useGlobalSearch from '../../../hooks/useGlobalSearch';
import { getUserContext } from '../../../services/api';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import '../../../styles/ArticleManagement.css'; // Reuse existing table styles


const OurServicesManagement = () => {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { role: userRole } = getUserContext();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState(null);
    const PAGE_SIZE = 5;
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const fetchServices = async (loadMore = false) => {
        try {
            if (loadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setCursor(null);
            }
            const cursorToUse = loadMore ? cursor : null;
            const data = await ourServicesService.getAll(cursorToUse, PAGE_SIZE);
            const items = data || [];

            if (loadMore) {
                setServices(prev => [...prev, ...items]);
            } else {
                setServices(items);
            }

            // If we got fewer items than PAGE_SIZE, there are no more to load
            if (items.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            // Update cursor to last item's id for next call
            if (items.length > 0) {
                setCursor(items[items.length - 1].id);
            }
        } catch (error) {
            showSnackbar('Failed to fetch services', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleDeleteClick = (service) => {
        setServiceToDelete(service);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        try {
            await ourServicesService.delete(serviceToDelete.id);
            showSnackbar('Service deleted successfully', 'success');
            // Remove locally instead of refetching to preserve cursor state
            setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
        } catch (error) {
            const backendMsg = error.response?.data?.message || error.response?.data?.error;
            showSnackbar(backendMsg || 'Delete failed', 'error');
        } finally {
            setShowDeleteModal(false);
            setServiceToDelete(null);
        }
    };

    const handleEdit = (id) => {
        navigate(`/cms/our-services/edit/${id}`);
    };

    const filteredServices = useMemo(() => {
        if (!searchQuery.trim()) return services;
        return services.filter(s => 
            s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [services, searchQuery]);

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
        title: "Our Services",
        searchQuery: globalSearchQuery,
        handleSearch: handleGlobalSearch,
        showSearchResults: showGlobalSearchResults,
        searchResults: globalSearchResults,
        navigateToResult: navigateToGlobalResult,
        setShowSearchResults: setShowGlobalSearchResults,
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <div className="am-header">
                <div className="am-title-section">
                    <h1 className="am-title">
                        <i className="fas fa-hand-holding-heart"></i>
                        Our Services
                    </h1>
                    <p className="am-subtitle">Manage the core services offered by Career Vedha.</p>
                </div>
                <button className="am-btn-primary" onClick={() => navigate('/cms/our-services/new')}>
                    <i className="fas fa-plus"></i> New Service
                </button>
            </div>

            <div className="am-filter-bar">
                <div className="am-search-form" style={{ maxWidth: '400px' }}>
                    <div className="am-search-wrapper">
                        <i className="fas fa-search am-search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="am-search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="am-table-container">
                {loading ? (
                    <SkeletonTable columns={5} rows={5} />
                ) : filteredServices.length === 0 ? (
                    <div className="am-empty-state">
                        <i className="fas fa-concierge-bell"></i>
                        <h3>No Services Found</h3>
                        <p>Get started by creating your first service offering.</p>
                    </div>
                ) : (
                    <table className="am-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.map((service) => (
                                <tr key={service.id}>
                                    <td style={{ fontWeight: 'bold', color: 'var(--slate-500)' }}>#{service.id}</td>
                                    <td style={{ fontWeight: '600' }}>{service.title}</td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--slate-500)' }}>
                                        {service.description}
                                    </td>
                                    <td>
                                        {new Date(service.createdAt).toLocaleDateString('en-GB')}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="am-action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button className="am-action-btn am-btn-edit" onClick={() => handleEdit(service.id)}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="am-action-btn am-btn-delete" onClick={() => handleDeleteClick(service)}>
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && hasMore && filteredServices.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                    <button 
                        className="am-btn-primary" 
                        onClick={() => fetchServices(true)} 
                        disabled={loadingMore}
                        style={{ minWidth: '180px' }}
                    >
                        {loadingMore ? (
                            <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                        ) : (
                            <><i className="fas fa-arrow-down"></i> Load More</>  
                        )}
                    </button>
                </div>
            )}

            {!loading && !hasMore && services.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '1rem 0', fontSize: '14px' }}>
                    — All services loaded —
                </p>
            )}

            {showDeleteModal && (
                <div className="am-modal-overlay">
                    <div className="am-modal">
                        <div className="am-modal-header">
                            <h3>Confirm Deletion</h3>
                            <button className="am-modal-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
                        </div>
                        <div className="am-modal-body" style={{ textAlign: 'center' }}>
                            <div className="am-warning-icon" style={{ background: '#ef4444' }}>
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h4>Delete "{serviceToDelete?.title}"?</h4>
                            <p>This action is permanent and cannot be undone.</p>
                        </div>
                        <div className="am-modal-footer">
                            <button className="am-btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-reactivate confirm" style={{ background: '#ef4444' }} onClick={confirmDelete}>Delete Service</button>
                        </div>
                    </div>
                </div>
            )}
        </CMSLayout>
    );
};

export default OurServicesManagement;
