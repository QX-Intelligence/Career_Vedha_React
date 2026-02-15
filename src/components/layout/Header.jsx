import React, { useState, useEffect } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { newsService, searchService } from '../../services';
import { getTranslations } from '../../utils/translations';

const Header = ({ onToggleMenu, isMenuOpen, activeLanguage, onLanguageChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const t = getTranslations(activeLanguage || 'telugu');

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                const results = await newsService.getSearchSuggestions(
                    searchQuery,
                    '',
                    activeLanguage === 'telugu' ? 'te' : 'en'
                );
                setSuggestions(results);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeLanguage]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const toggleLanguage = (lang) => {
        if (onLanguageChange) {
            onLanguageChange(lang);
        }
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
                    <form className="search-bar" onSubmit={handleSearch} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                        />
                        <button type="submit"><i className="fas fa-search"></i></button>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/${item.section}/${item.slug}`}
                                        className="suggestion-item"
                                        onClick={() => setShowSuggestions(false)}
                                    >
                                        <div className="suggestion-content">
                                            <i className="fas fa-file-alt"></i>
                                            <span>{item.title}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
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
