import React, { useState } from 'react';

import { searchService } from '../../services';

const Header = ({ onToggleMenu, isMenuOpen }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLanguage, setActiveLanguage] = useState('english');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            try {
                // When backend is ready, this will call the API
                // const results = await searchService.search(searchQuery);
                // console.log('Search results:', results);
                alert(`Searching for: ${searchQuery}`);
            } catch (error) {
                console.error('Search error:', error);
            }
        }
    };

    const toggleLanguage = (lang) => {
        setActiveLanguage(lang);
        // Add language change logic here
    };

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="header-content">
                    <div className="logo-box">
                        <div className="logo-icon">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div className="logo-text">
                            <h1>Career Vedha</h1>
                            <p>EDUCATION</p>
                        </div>
                    </div>
                    <form className="search-bar" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search here"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit"><i className="fas fa-search"></i></button>
                    </form>
                    <div className="header-right">
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
                        <button
                            className="mobile-menu-toggle"
                            onClick={onToggleMenu}
                        >
                            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
