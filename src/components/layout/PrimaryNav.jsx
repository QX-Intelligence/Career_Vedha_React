import React, { useState } from 'react';

const PrimaryNav = ({ isOpen }) => {
    const navItems = [
        { name: 'Home', icon: 'fas fa-home', active: true, hasDropdown: false },
        { name: 'Academic Exams', icon: null, hasDropdown: true },
        { name: 'Competitive Exams', icon: null, hasDropdown: true },
        { name: 'Current Affairs', icon: null, hasDropdown: true },
        { name: 'Jobs', icon: null, hasDropdown: false },
        { name: 'Notifications', icon: null, hasDropdown: true },
        { name: 'E-Store', icon: null, hasDropdown: false },
        { name: 'Videos', icon: null, hasDropdown: false },
        // { name: 'Online Tests', icon: null, hasDropdown: false },
        // { name: 'తెలుగు', icon: null, hasDropdown: false, isSpecial: true }
    ];

    return (
        <nav className="primary-nav">
            <div className="nav-container">
                <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
                    {navItems.map((item, index) => (
                        <li key={index} className={item.isSpecial ? 'special-item' : ''}>
                            <a href="#" className={item.active ? 'active' : ''}>
                                {item.icon && <i className={item.icon}></i>}
                                {item.name}
                                {item.hasDropdown && <i className="fas fa-plus dropdown-icon"></i>}
                            </a>
                        </li>
                    ))}
                </ul>
                {/* Mobile Toggle moved to Header.jsx */}
            </div>
        </nav>
    );
};

export default PrimaryNav;
