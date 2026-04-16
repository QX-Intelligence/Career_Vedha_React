import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const MobileTopBar = () => {
  const { activeLanguage, setLanguage } = useLanguage();

  const toggleLanguage = (lang) => {
      setLanguage(lang);
  };

  return (
    <div className="mobile-top-bar">
      <NavLink to="/" className="mobile-logo">
        <img 
          src="/Career Vedha logo1.png" 
          alt="Career Vedha" 
          style={{ width: '130px', height: 'auto', objectFit: 'contain', margin: '-10px 0' }}
        />
      </NavLink>

      <div className="top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="language-toggle">
            <button
                className={`lang-btn ${activeLanguage === 'english' ? 'active' : ''}`}
                onClick={() => toggleLanguage('english')}
            >
                English
            </button>
            <button
                className={`lang-btn ${activeLanguage === 'telugu' ? 'active' : ''}`}
                onClick={() => toggleLanguage('telugu')}
            >
                తెలుగు
            </button>
        </div>
        <NavLink to="/dashboard" className="profile-btn">
          <User size={20} />
        </NavLink>
      </div>

    </div>
  );
};

export default MobileTopBar;
