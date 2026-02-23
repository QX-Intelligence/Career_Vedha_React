import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getTranslations } from '../../utils/translations';
import djangoApi from '../../services/djangoApi';
import { academicsService } from '../../services/academicsService';
import API_CONFIG from '../../config/api.config';

const PrimaryNav = ({ isOpen }) => {
    const location = useLocation();
    const activeLanguage = localStorage.getItem('preferredLanguage') || 'english';
    const t = getTranslations(activeLanguage);
    const [sections, setSections] = useState([]);
    const [levels, setLevels] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                // Fetch Article Sections
                const sectionsResponse = await djangoApi.get(API_CONFIG.DJANGO_ENDPOINTS.TAXONOMY_SECTIONS);
                const sData = sectionsResponse.data;
                setSections(Array.isArray(sData) ? sData : (sData?.results || sData?.data || []));

                // Fetch Academic Levels
                const levelsData = await academicsService.getLevels();
                setLevels(Array.isArray(levelsData) ? levelsData : (levelsData?.results || levelsData?.data || []));
            } catch (error) {
                console.error('Error fetching data for nav:', error);
            }
        };
        fetchNavData();
    }, []);
    
    const navItems = [
        { name: t.navHome, icon: 'fas fa-home', path: '/', hasDropdown: false },
        { name: t.navNews, icon: 'fas fa-bullhorn', path: '/news', hasDropdown: false },
        { 
            name: t.navArticles, 
            icon: 'fas fa-newspaper', 
            path: '/articles', 
            hasDropdown: true,
            dropdownItems: Array.isArray(sections) ? sections.map(s => ({
                name: s.name,
                path: `/articles?section=${s.id}`
            })) : []
        },
        { 
            name: t.navAcademics, 
            icon: 'fas fa-graduation-cap', 
            path: '/academic-exams', 
            hasDropdown: true,
            dropdownItems: Array.isArray(levels) ? levels.map(l => ({
                name: l.name,
                path: `/academic-exams?level=${l.id}`
            })) : []
        },
        { 
            name: t.navCurrentAffairs, 
            icon: 'fas fa-globe-americas', 
            path: '/current-affairs', 
            hasDropdown: true,
            dropdownItems: [
                { name: activeLanguage === 'telugu' ? 'భారతదేశం (జాతీయ)' : 'National (India)', path: '/current-affairs?region=INDIA' },
                { name: activeLanguage === 'telugu' ? 'తెలంగాణ' : 'Telangana', path: '/current-affairs?region=TS' },
                { name: activeLanguage === 'telugu' ? 'ఆంధ్ర ప్రదేశ్' : 'Andhra Pradesh', path: '/current-affairs?region=AP' }
            ]
        },
        { name: t.navJobs, icon: 'fas fa-briefcase', path: '/jobs', hasDropdown: false },
        { 
            name: t.navVideos, 
            icon: 'fas fa-video', 
            path: '/videos', 
            hasDropdown: true,
            dropdownItems: [
                { name: t.navLongVideos, path: '/videos/long' },
                { name: t.navShorts, path: '/videos/shorts' }
            ]
        },
        { name: t.navEStore, icon: 'fas fa-shopping-cart', path: '/e-store', hasDropdown: false },
    ];

    const handleMouseEnter = (index) => {
        if (window.innerWidth > 1024) {
            setActiveDropdown(index);
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth > 1024) {
            setActiveDropdown(null);
        }
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
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        
                        return (
                            <li 
                                key={index} 
                                className={`${item.isSpecial ? 'special-item' : ''} ${item.hasDropdown ? 'has-dropdown' : ''}`}
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link 
                                    to={item.path} 
                                    className={`${isActive ? 'active' : ''} ${activeDropdown === index ? 'dropdown-active' : ''}`}
                                    onClick={(e) => item.hasDropdown && toggleDropdown(e, index)}
                                >
                                    {item.icon && <i className={item.icon}></i>}
                                    {item.name}
                                    {item.hasDropdown && <i className={`fas fa-chevron-down dropdown-icon ${activeDropdown === index ? 'rotate' : ''}`}></i>}
                                </Link>

                                {item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0 && (
                                    <ul className={`nav-dropdown ${activeDropdown === index ? 'show' : ''}`}>
                                        {item.dropdownItems.map((subItem, subIndex) => (
                                            <li key={subIndex}>
                                                <Link to={subItem.path}>{subItem.name}</Link>
                                            </li>
                                        ))}
                                    </ul>
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
