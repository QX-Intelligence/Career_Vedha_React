import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserContext } from '../../services/api';
import { checkAccess } from '../../config/accessControl.config';

/**
 * ProtectedRoute component filters access based on authentication and role permissions.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if access is granted
 * @param {string} props.module - The module identifier to check against role permissions
 * @param {boolean} props.requireAdmin - If true, only ADMIN or SUPER_ADMIN can access (bypassing module check)
 */
const ProtectedRoute = ({ children, module, requireAdmin = false }) => {
    const { isAuthenticated, role } = getUserContext();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    // Role-based authorization
    if (requireAdmin) {
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return <Navigate to="/dashboard" replace />;
        }
    } else if (module) {
        if (!checkAccess(role, module)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
