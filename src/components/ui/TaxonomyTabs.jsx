import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './TaxonomyTabs.css';

const TaxonomyTabs = ({ sectionSlug }) => {
    const { langCode } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    
    // Some sections use ?level=, academics uses ?category=
    const categorySlug = query.get('category') || query.get('level');
    const subSlug = query.get('sub_category') || query.get('sub');
    const segmentSlug = query.get('segment');

    const mapSlugToKey = (slug) => {
        if (slug === 'campus-pages') return 'campusPages';
        if (slug === 'current-affairs') return 'currentAffairs';
        if (slug === 'academic-exams' || slug === 'exams') return 'exams';
        return slug;
    };

    const [cacheHash, setCacheHash] = useState(0);
    
    useEffect(() => {
        const handleUpdate = () => setCacheHash(prev => prev + 1);
        const eventName = `cv-nav-updated-${langCode}`;
        const cacheKey = `cv_nav_tree_v4_${langCode}`;
        
        window.addEventListener(eventName, handleUpdate);
        // Also listen for storage from other tabs for consistency
        const storageHandler = (e) => {
            if (e.key === cacheKey) handleUpdate();
        };
        window.addEventListener('storage', storageHandler);
        
        return () => {
            window.removeEventListener(eventName, handleUpdate);
            window.removeEventListener('storage', storageHandler);
        };
    }, [langCode]);

    const tabsInfo = useMemo(() => {
        try {
            const cacheKey = `cv_nav_tree_v4_${langCode}`;
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return { tabs: [], parent: null, depth: 0 };
            
            const { data } = JSON.parse(cached);
            const sectionKey = mapSlugToKey(sectionSlug);
            const sectionData = data[sectionKey];
            if (!sectionData) return { tabs: [], parent: null, depth: 0 };

            // 1. Root Level (e.g., States)
            if (!categorySlug) {
                return { tabs: sectionData, parent: null, depth: 0 };
            }

            // 2. Depth 1 (e.g., Districts)
            const categoryNode = sectionData.find(c => 
                c.slug === categorySlug || 
                c.id === parseInt(categorySlug) ||
                c.id === categorySlug
            );
            if (!categoryNode) return { tabs: [], parent: null, depth: 0 };

            if (!subSlug) {
                return { tabs: categoryNode.children || [], parent: categoryNode, depth: 1 };
            }

            // 3. Depth 2 (e.g., Segments/Chapters)
            const subNode = categoryNode.children?.find(s => 
                s.slug === subSlug || 
                s.id === parseInt(subSlug) ||
                s.id === subSlug
            );
            if (!subNode) return { tabs: [], parent: null, depth: 1 };

            return { tabs: subNode.children || [], parent: subNode, depth: 2 };

        } catch (error) {
            console.error("Failed to parse taxonomy cache for tabs:", error);
            return { tabs: [], parent: null, depth: 0 };
        }
    }, [sectionSlug, categorySlug, subSlug, cacheHash]);

    const { tabs, parent, depth } = tabsInfo;
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Check if scroll buttons should be visible
    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 5);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [tabs]);

    const handleScroll = (direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = 300;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
        // Small delay to check scroll position after animation
        setTimeout(checkScroll, 350);
    };

    // Build the URL to switch tabs precisely based on depth
    const buildTabUrl = (tabSlug) => {
        const params = new URLSearchParams(location.search);
        // Ensure section stays correct
        params.set('section', sectionSlug);
        
        if (depth === 0) {
            // Switching between root categories
            params.set('category', tabSlug);
            params.delete('level'); // Cleanup legacy
            params.delete('sub'); // Cleanup legacy
            params.delete('sub_category');
            params.delete('segment');
        } else if (depth === 1) {
            params.set('sub_category', tabSlug);
            params.delete('sub'); // Cleanup legacy
            params.delete('segment');
        } else {
            params.set('segment', tabSlug);
        }
        return `${location.pathname}?${params.toString()}`;
    };

    // Auto-select the first tab if depth is 2 (segments) and none is selected
    // For States/Districts (Depth 0/1), we don't auto-select to avoid surprising navigation
    if (depth === 2 && !segmentSlug && tabs && tabs.length > 0) {
        setTimeout(() => {
            navigate(buildTabUrl(tabs[0].slug), { replace: true });
        }, 0);
    }

    const buildBreadcrumbUrl = (level) => {
        const params = new URLSearchParams(location.search);
        if (level === 'root') {
            params.delete('category');
            params.delete('level');
            params.delete('sub');
            params.delete('sub_category');
            params.delete('segment');
        } else if (level === 'category') {
            params.delete('sub');
            params.delete('sub_category');
            params.delete('segment');
        }
        return `${location.pathname}?${params.toString()}`;
    };

    // If no breadcrumbs AND no tabs, then only return null
    if (depth === 0 && (!tabs || tabs.length === 0)) {
        return null;
    }

    return (
        <div className={`taxonomy-tabs-wrapper depth-${depth}`}>
            <div className="taxonomy-nav-header">
                {depth > 0 && (
                    <div className="taxonomy-breadcrumbs">
                        <Link to={buildBreadcrumbUrl('root')} className="breadcrumb-item home-link" title="All Categories">
                            <i className="fas fa-th-large"></i>
                            <span>All</span>
                        </Link>
                        
                        <span className="breadcrumb-separator">/</span>
                        
                        {/* Level 1: Category */}
                        <Link 
                            to={buildBreadcrumbUrl('category')} 
                            className={`breadcrumb-item ${depth === 1 ? 'active-crumb' : ''}`}
                        >
                            {depth === 1 ? parent?.name : (categorySlug?.replace(/-/g, ' ') || 'Category')}
                        </Link>
                        
                        {/* Level 2: Sub-category */}
                        {depth === 2 && parent && (
                            <>
                                <span className="breadcrumb-separator">/</span>
                                <span className="breadcrumb-item active-crumb">{parent.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {tabs && tabs.length > 0 && (
                <div className="taxonomy-tabs-container">
                    {showLeftArrow && (
                        <button 
                            className="nav-arrow left" 
                            onClick={() => handleScroll('left')}
                            aria-label="Scroll Left"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}
                    
                    <div 
                        className="taxonomy-tabs-scroll" 
                        ref={scrollRef}
                        onScroll={checkScroll}
                    >
                        {tabs.map(tab => {
                            // Matching logic based on depth
                            let isActive = false;
                            if (depth === 0) isActive = categorySlug === tab.slug;
                            else if (depth === 1) isActive = subSlug === tab.slug;
                            else isActive = segmentSlug === tab.slug || (!segmentSlug && tabs[0].id === tab.id);

                            return (
                                <Link 
                                    key={tab.id}
                                    to={buildTabUrl(tab.slug)}
                                    className={`taxonomy-tab ${isActive ? 'active' : ''}`}
                                >
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>

                    {showRightArrow && (
                        <button 
                            className="nav-arrow right" 
                            onClick={() => handleScroll('right')}
                            aria-label="Scroll Right"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaxonomyTabs;
