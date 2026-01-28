import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CMSBreadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Map of path segments to friendly names
    const breadcrumbNameMap = {
        'dashboard': 'Dashboard',
        'cms': 'CMS',
        'articles': 'Articles',
        'jobs': 'Jobs',
        'taxonomy': 'Taxonomy',
        'new': 'New',
        'edit': 'Edit'
    };

    return (
        <nav className="cms-breadcrumbs">
            <Link to="/dashboard">
                <i className="fas fa-home"></i>
                <span>Home</span>
            </Link>
            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const name = breadcrumbNameMap[value] || value;

                // Skip "dashboard" if it's the first element since we have "Home"
                if (value === 'dashboard' && index === 0) return null;
                // Skip numeric IDs or long slugs for cleaner breadcrumbs
                if (value.length > 20 || /^\d+$/.test(value)) return null;

                return last ? (
                    <span key={to} className="breadcrumb-item active">
                        <i className="fas fa-chevron-right"></i>
                        <span>{name}</span>
                    </span>
                ) : (
                    <span key={to} className="breadcrumb-item">
                        <i className="fas fa-chevron-right"></i>
                        <Link to={to}>{name}</Link>
                    </span>
                );
            })}
        </nav>
    );
};

export default CMSBreadcrumbs;
