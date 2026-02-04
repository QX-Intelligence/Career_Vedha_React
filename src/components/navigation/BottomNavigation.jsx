import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, FileText, Menu, Search } from 'lucide-react';
import MobileSearchOverlay from './MobileSearchOverlay';

const BottomNavigation = ({ onMenuClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={24} />
          <span>Jobs</span>
        </NavLink>

        <div className="nav-item search-trigger" onClick={() => setIsSearchOpen(true)}>
          <div className="search-fab">
            <Search size={24} color="white" />
          </div>
        </div>

        {/* Replaced Admin with Articles as requested */}
        <NavLink to="/archive" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={24} />
          <span>Articles</span>
        </NavLink>

        <button onClick={onMenuClick} className="nav-item menu-btn">
          <Menu size={24} />
          <span>More</span>
        </button>

      </nav>

      <MobileSearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default BottomNavigation;
