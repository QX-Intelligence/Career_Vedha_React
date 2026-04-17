import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getTranslations } from '../../utils/translations';
import { newsService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';

const NAV_CACHE_BASE = 'cv_nav_tree_v4';

// ─── Slugs that use tree (multi-level) vs levels (flat) ───────────────────────
const TREE_SECTIONS = ['academics', 'news', 'current-affairs', 'jobs', 'campus-pages', 'exams'];
const LEVEL_SECTIONS = [];

// ─── Helper ───────────────────────────────────────────────────────────────────
const slugKey = (slug) =>
    slug === 'current-affairs' ? 'currentAffairs' :
    slug === 'campus-pages'    ? 'campusPages'    : slug;

// ─── Recursive Dropdown (handles both flat levels & tree structures) ─────────
const DropdownMenu = ({ items, show, isLoading, buildUrl }) => {
    // Mobile active states for nested dropdowns
    const [activeSub, setActiveSub] = useState(null);

    const toggleSub = (e, id) => {
        if (window.innerWidth <= 1024) {
            e.preventDefault();
            setActiveSub(activeSub === id ? null : id);
        }
    };

    const getUrl = (item, sub) => {
        if (typeof buildUrl === 'function') {
            return buildUrl(item, sub);
        }
        return item.path || '#';
    };

    return (
        <ul className={`nav-dropdown ${show ? 'show' : ''}`}>
            {items && items.length > 0 ? (
                items.map((item, index) => {
                    const hasSub = item.children && item.children.length > 0;
                    
                    if (hasSub) {
                        return (
                            <li 
                                key={item.id || index} 
                                className={`has-sub-dropdown ${activeSub === item.id ? 'sub-active' : ''}`}
                            >
                                <Link 
                                    to={getUrl(item)}
                                    onClick={(e) => toggleSub(e, item.id)}
                                >
                                    {item.name}
                                    <i className="fas fa-chevron-right" style={{ fontSize: '10px', opacity: 0.5 }}></i>
                                </Link>
                                
                                {/* Depth-1 flyout */}
                                <ul className="sub-dropdown">
                                    {item.children.map(subItem => (
                                        <li key={subItem.id}>
                                            <Link 
                                                to={getUrl(item, subItem)}
                                            >
                                                {subItem.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        );
                    }

                    // Flat item (News, Jobs, etc. when they don't have children)
                    return (
                        <li key={index}>
                            <Link to={item.path || getUrl(item)}>{item.name}</Link>
                        </li>
                    );
                })
            ) : isLoading ? (
                <li className="dropdown-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                </li>
            ) : null}
        </ul>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PrimaryNav = ({ isOpen }) => {
    const location = useLocation();
    const { activeLanguage } = useLanguage();
    const t = getTranslations(activeLanguage);

    const [navData, setNavData] = useState({
        academics: [],
        news: [],
        currentAffairs: [],
        jobs: [],
        campusPages: [],
        exams: []
    });
    const [allSections, setAllSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const leaveTimer = useRef(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
        
        // One-time cleanup of stale cache keys if they exist
        try {
            localStorage.removeItem(`${NAV_CACHE_BASE}_en`);
            localStorage.removeItem(`${NAV_CACHE_BASE}_te`);
        } catch (_) {}

        const fetchNavData = async () => {
            setIsLoading(true);

            // 2. Fetch from API
            try {
                const [treeResults, levelResults, sectionsData] = await Promise.all([
                    Promise.all(
                        TREE_SECTIONS.map(async (slug) => {
                            const data = await newsService.getTaxonomyTree(slug, activeLanguage);
                            return { slug, data: Array.isArray(data) ? data : [] };
                        })
                    ),
                    Promise.all(
                        LEVEL_SECTIONS.map(async (slug) => {
                            const data = await newsService.getTaxonomyLevels(slug, activeLanguage);
                            return { slug, data: Array.isArray(data) ? data : [] };
                        })
                    ),
                    newsService.getSections()
                ]);

                const newData = {};
                [...treeResults, ...levelResults].forEach(({ slug, data }) => {
                    newData[slugKey(slug)] = data;
                });

                setNavData(prev => ({ ...prev, ...newData }));
                setAllSections(sectionsData || []);
                
                // Dispatch event so components like TaxonomyTabs can refresh
                window.dispatchEvent(new CustomEvent(`cv-nav-updated-${langCode}`, { detail: { data: newData, sections: sectionsData || [] } }));

            } catch (error) {
                console.error('[PrimaryNav] Error fetching nav data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNavData();
    }, [activeLanguage]);

    // ── Nav item definitions ───────────────────────────────────────────────────
    const navItems = [
        { name: t.navHome, icon: 'fas fa-home', path: '/', hasDropdown: false },
        {
            name: t.navAcademics,
            icon: 'fas fa-graduation-cap',
            path: '/academics',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/academics?category=${item.slug}&sub_category=${sub.slug}` 
                : `/academics?category=${item.slug}`,
            dropdownItems: navData.academics
        },
        {
            name: t.navExams,
            icon: 'fas fa-pen-nib',
            path: '/academic-exams',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/academic-exams?category=${item.slug}&sub_category=${sub.slug}` 
                : `/academic-exams?category=${item.slug || item.id}`,
            dropdownItems: navData.exams
        },
        {
            name: t.navCurrentAffairs,
            icon: 'fas fa-globe-americas',
            path: '/current-affairs',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/current-affairs?category=${item.slug}&sub_category=${sub.slug}` 
                : `/current-affairs?category=${item.slug || item.id}`,
            dropdownItems: navData.currentAffairs
        },
        {
            name: t.navCampusPages,
            icon: 'fas fa-university',
            path: '/articles?section=campus-pages',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/articles?section=campus-pages&category=${item.slug}&sub_category=${sub.slug}` 
                : `/articles?section=campus-pages&category=${item.slug || item.id}`,
            dropdownItems: navData.campusPages
        },
        {
            name: t.navNews,
            icon: 'fas fa-bullhorn',
            path: '/news',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/news?category=${item.slug}&sub_category=${sub.slug}` 
                : `/news?category=${item.slug || item.id}`,
            dropdownItems: navData.news
        },
        {
            name: t.navJobs,
            icon: 'fas fa-briefcase',
            path: '/jobs',
            hasDropdown: true,
            isTree: true,
            buildUrl: (item, sub) => sub 
                ? `/jobs?category=${item.slug}&sub_category=${sub.slug}` 
                : `/jobs?category=${item.slug || item.id}`,
            dropdownItems: navData.jobs
        },
        { name: t.navEStore, icon: 'fas fa-shopping-cart', path: '/e-store', hasDropdown: false },
        {
            name: t.navMore,
            icon: 'fas fa-ellipsis-h',
            path: '#',
            hasDropdown: true,
            dropdownItems: [
                { name: "Course Materials", path: '/curriculum' },
                { name: "Videos", path: '/videos' },
                { name: "Previous Papers", path: '/question-papers' },
                // Dynamic sections from admin (if not already in tree sections)
                ...(allSections || [])
                    .filter(s => !TREE_SECTIONS.includes(s.slug))
                    .map(s => ({
                        name: s.name,
                        path: `/articles?section=${s.slug}`
                    }))
            ]
        }
    ];

    // ── Mouse handlers with small delay to allow moving into dropdown ──────────
    const handleMouseEnter = (index) => {
        if (window.innerWidth > 1024) {
            clearTimeout(leaveTimer.current);
            setActiveDropdown(index);
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth > 1024) {
            leaveTimer.current = setTimeout(() => setActiveDropdown(null), 120);
        }
    };

    const handleDropdownMouseEnter = () => {
        clearTimeout(leaveTimer.current);
    };

    const handleDropdownMouseLeave = () => {
        leaveTimer.current = setTimeout(() => setActiveDropdown(null), 120);
    };

    const toggleDropdown = (e, index) => {
        if (window.innerWidth <= 1024) {
            e.preventDefault();
            setActiveDropdown(activeDropdown === index ? null : index);
        }
    };

    return (
        <nav className="primary-nav">
            <div className="nav-container">
                <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
                    {navItems.map((item, index) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path.split('?')[0]));
                        const isOpen_ = activeDropdown === index;

                        return (
                            <li
                                key={index}
                                className={`${item.isSpecial ? 'special-item' : ''} ${item.hasDropdown ? 'has-dropdown' : ''}`}
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {item.path.startsWith('http') ? (
                                    <a
                                        href={item.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${isActive ? 'active' : ''} ${isOpen_ ? 'dropdown-active' : ''}`}
                                    >
                                        {item.icon && <i className={item.icon}></i>}
                                        {item.name}
                                    </a>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`${isActive ? 'active' : ''} ${isOpen_ ? 'dropdown-active' : ''}`}
                                        onClick={(e) => item.hasDropdown && toggleDropdown(e, index)}
                                    >
                                        {item.icon && <i className={item.icon}></i>}
                                        {item.name}
                                        {item.hasDropdown && (
                                            <i className={`fas fa-chevron-down dropdown-icon ${isOpen_ ? 'rotate' : ''}`}></i>
                                        )}
                                    </Link>
                                )}

                                {/* ── DROPDOWN (handles flat or tree data) ── */}
                                {item.hasDropdown && (
                                    <div
                                        onMouseEnter={handleDropdownMouseEnter}
                                        onMouseLeave={handleDropdownMouseLeave}
                                    >
                                        <DropdownMenu
                                            items={item.dropdownItems}
                                            show={isOpen_}
                                            isLoading={isLoading}
                                            buildUrl={item.buildUrl}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default PrimaryNav;
