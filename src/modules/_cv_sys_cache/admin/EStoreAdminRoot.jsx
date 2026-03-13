import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import { getUserContext } from '../../../services/api';

import '../../../styles/UserManagement.css';

// Admin Pages
import AdminOverview from './pages/AdminOverview';
import AdminBooks from './pages/AdminBooks';
import AdminOrders from './pages/AdminOrders';

const EStoreAdminRoot = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role: userRole } = getUserContext();
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    // Determine active sub-section from URL for the navbar search/breadcrumbs if needed
    // The main sidebar 'activeSection' simply remains 'e-store' so the sidebar tab stays highlighted
    const getSubSection = () => {
        const path = location.pathname;
        if (path.includes('/books')) return 'books';
        if (path.includes('/orders')) return 'orders';
        return 'overview';
    };

    const handleLogout = () => {
        navigate('/admin-login');
    };

    const checkAccess = useCallback((module) => {
        return checkAccessGlobal(userRole, module);
    }, [userRole]);

    const sidebarProps = {
        activeSection: 'e-store',
        checkAccess,
        MODULES,
        onLogout: handleLogout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: "E-Store Admin",
        searchQuery: '',
        handleSearch: () => {},
        showSearchResults: false,
        searchResults: [],
        navigateToResult: () => {},
        setShowSearchResults: () => {},
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            {/* Inner Dashboard Tabs wrapper specifically for E-Store Navigation */}
            <div className="um-filter-bar" style={{ marginBottom: '2rem' }}>
                <div className="um-tabs">
                    <button
                        className={`um-tab ${getSubSection() === 'overview' ? 'active' : ''}`}
                        onClick={() => navigate('/cms/e-store')}
                    >
                        <i className="fas fa-chart-line"></i>
                        Overview
                    </button>
                    <button
                        className={`um-tab ${getSubSection() === 'books' ? 'active' : ''}`}
                        onClick={() => navigate('/cms/e-store/books')}
                    >
                        <i className="fas fa-book"></i>
                        Books Inventory
                    </button>
                    <button
                        className={`um-tab ${getSubSection() === 'orders' ? 'active' : ''}`}
                        onClick={() => navigate('/cms/e-store/orders')}
                    >
                        <i className="fas fa-shopping-cart"></i>
                        Orders
                    </button>
                </div>
            </div>

            <div className="estore-admin-content-area">
                <Routes>
                    <Route path="/" element={<AdminOverview />} />
                    <Route path="/books" element={<AdminBooks />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </CMSLayout>
    );
};

export default EStoreAdminRoot;
