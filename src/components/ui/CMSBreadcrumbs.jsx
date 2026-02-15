import React, { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const CMSBreadcrumbs = memo(() => {
    const location = useLocation();
    
    // Map of path segments to friendly names
    const breadcrumbNameMap = useMemo(() => ({
        'dashboard': 'Dashboard',
        'cms': 'CMS',
        'articles': 'Articles',
        'jobs': 'Jobs',
        'taxonomy': 'Taxonomy',
        'new': 'New',
        'edit': 'Edit',
        'academics': 'Academics',
        'media': 'Media'
    }), []);

    const crumbs = useMemo(() => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        
        return pathnames.map((value, index) => {
            const isLast = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const name = breadcrumbNameMap[value] || value;

            // Skip "dashboard" if it's the first element since we have "Home"
            if (value === 'dashboard' && index === 0) return null;
            // Skip numeric IDs or long slugs for cleaner breadcrumbs
            if (value.length > 20 || /^\d+$/.test(value)) return null;

            return { to, name, isLast };
        }).filter(Boolean);
    }, [location.pathname, breadcrumbNameMap]);

    return (
        <nav className="cms-breadcrumbs">
            <Link to="/dashboard">
                <i className="fas fa-home"></i>
                <span>Home</span>
            </Link>
            {crumbs.map((crumb) => (
                crumb.isLast ? (
                    <span key={crumb.to} className="breadcrumb-item active">
                        <i className="fas fa-chevron-right"></i>
                        <span>{crumb.name}</span>
                    </span>
                ) : (
                    <span key={crumb.to} className="breadcrumb-item">
                        <i className="fas fa-chevron-right"></i>
                        <Link to={crumb.to}>{crumb.name}</Link>
                    </span>
                )
            ))}
        </nav>
    );
});

export default CMSBreadcrumbs;
