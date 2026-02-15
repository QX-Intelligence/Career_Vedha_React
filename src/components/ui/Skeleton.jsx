import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Skeleton Loading Component
 * Provides consistent loading states across the application
 */
const Skeleton = ({ 
    variant = 'text', 
    width = '100%', 
    height, 
    count = 1, 
    className = '',
    style = {}
}) => {
    const getDefaultHeight = () => {
        switch (variant) {
            case 'text': return '16px';
            case 'title': return '24px';
            case 'card': return '200px';
            case 'circle': return '40px';
            case 'chart': return '300px';
            case 'table-row': return '48px';
            default: return '16px';
        }
    };

    const getVariantClass = () => {
        switch (variant) {
            case 'circle': return 'skeleton-circle';
            case 'card': return 'skeleton-card';
            case 'chart': return 'skeleton-chart';
            case 'table-row': return 'skeleton-table-row';
            default: return 'skeleton-text';
        }
    };

    const skeletonStyle = {
        width: variant === 'circle' ? height || getDefaultHeight() : width,
        height: height || getDefaultHeight(),
        ...style
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`skeleton ${getVariantClass()} ${className}`}
                    style={skeletonStyle}
                    aria-label="Loading..."
                    role="status"
                />
            ))}
        </>
    );
};

Skeleton.propTypes = {
    variant: PropTypes.oneOf(['text', 'title', 'card', 'circle', 'chart', 'table-row']),
    width: PropTypes.string,
    height: PropTypes.string,
    count: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object
};

/**
 * Skeleton Card - For card-based layouts
 */
export const SkeletonCard = ({ count = 1 }) => (
    <div className="skeleton-card-wrapper">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="stat-card no-hover-transform" style={{ padding: '1.5rem' }}>
                <Skeleton variant="title" width="60%" style={{ marginBottom: '1rem' }} />
                <Skeleton variant="text" width="40%" style={{ marginBottom: '0.5rem' }} />
                <Skeleton variant="text" width="80%" />
            </div>
        ))}
    </div>
);

/**
 * Skeleton Table - For table layouts
 */
export const SkeletonTable = ({ rows = 5 }) => (
    <div className="skeleton-table">
        <Skeleton variant="table-row" count={rows} style={{ marginBottom: '0.5rem' }} />
    </div>
);

/**
 * Skeleton List - For list layouts
 */
export const SkeletonList = ({ items = 5 }) => (
    <div className="skeleton-list">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--slate-50)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="70%" style={{ marginBottom: '0.5rem' }} />
                <Skeleton variant="text" width="50%" />
            </div>
        ))}
    </div>
);

/**
 * Skeleton Chart - For chart placeholders
 */
export const SkeletonChart = ({ height = '300px' }) => (
    <div className="stat-card no-hover-transform" style={{ padding: '2rem' }}>
        <Skeleton variant="title" width="40%" style={{ marginBottom: '1.5rem' }} />
        <Skeleton variant="chart" height={height} />
    </div>
);

export default Skeleton;
