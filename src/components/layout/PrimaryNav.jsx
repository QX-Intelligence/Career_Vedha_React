import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PrimaryNav = ({ isOpen }) => {
    const location = useLocation();
    const navItems = [
        { name: 'Home', icon: 'fas fa-home', path: '/', hasDropdown: false },
        { name: 'Academic Exams', path: '#', hasDropdown: true },
        { name: 'Competitive Exams', path: '#', hasDropdown: true },
        { name: 'Current Affairs', path: '#', hasDropdown: true },
        { name: 'Jobs', path: '/jobs', hasDropdown: false },
        { name: 'Notifications', path: '#', hasDropdown: true },
        { name: 'E-Store', path: '#', hasDropdown: false },
        { name: 'Videos', path: '#', hasDropdown: false },
    ];

    return (
        <nav className="primary-nav">
            <div className="nav-container">
                <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
                    {navItems.map((item, index) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        
                        return (
                            <li key={index} className={item.isSpecial ? 'special-item' : ''}>
                                <Link to={item.path} className={isActive ? 'active' : ''}>
                                    {item.icon && <i className={item.icon}></i>}
                                    {item.name}
                                    {item.hasDropdown && <i className="fas fa-plus dropdown-icon"></i>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default PrimaryNav;
