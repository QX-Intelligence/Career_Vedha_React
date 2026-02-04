import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, User } from 'lucide-react';

const MobileTopBar = () => {
  return (
    <div className="mobile-top-bar">
      <NavLink to="/" className="mobile-logo">
        <GraduationCap size={24} color="var(--primary-yellow)" />
        <div className="logo-text">
          <h1>CAREER VEDHA</h1>
          <p>LEARNING PORTAL</p>
        </div>
      </NavLink>

      <div className="top-bar-actions">
        {/* Removed notifications for public users as requested */}
        <NavLink to="/dashboard" className="profile-btn">
          <User size={20} />
        </NavLink>
      </div>

    </div>
  );
};

export default MobileTopBar;
