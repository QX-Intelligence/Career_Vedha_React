import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { globalSearchService } from '../../services';
import { getTranslations } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({ onToggleMenu, isMenuOpen }) => {
    const { activeLanguage, setLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const t = getTranslations(activeLanguage || 'telugu');

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                const results = await globalSearchService.searchAll(searchQuery);
                setSuggestions(results.results || []);
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
        setLanguage(lang);
    };

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="header-content">
                    <Link to="/" className="logo-box">
                        <img 
                            src="/Career Vedha logo.png" 
                            alt="Career Vedha Logo" 
                            className="site-logo"
                        />
                    </Link>
                    <form className="search-bar" onSubmit={handleSearch} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search articles, jobs, exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                        />
                        <button type="submit"><i className="fas fa-search"></i></button>

                        {showSuggestions && searchQuery.length >= 2 && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.length > 0 ? (
                                    <>
                                        {suggestions.map((item, index) => (
                                            <Link
                                                key={`${item.type}-${item.id}-${index}`}
                                                to={item.url}
                                                target={item.type === 'paper' ? '_blank' : '_self'}
                                                className="suggestion-item"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="suggestion-content">
                                                    <i className={`fas ${
                                                        item.type === 'article' ? 'fa-newspaper' :
                                                        item.type === 'job' ? 'fa-briefcase' :
                                                        item.type === 'paper' ? 'fa-file-pdf' :
                                                        item.type === 'currentAffair' ? 'fa-calendar-day' :
                                                        item.type === 'academic' ? 'fa-graduation-cap' :
                                                        item.type === 'product' ? 'fa-shopping-cart' : 'fa-file-alt'
                                                    }`}></i>
                                                    <div className="suggestion-text">
                                                        <span className="suggestion-title">{item.title}</span>
                                                        <span className="suggestion-type">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                        <div className="suggestions-footer">
                                            <Link 
                                                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                View all results for "{searchQuery}"
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-suggestions">
                                        <i className="fas fa-search"></i>
                                        <span>No results found for "{searchQuery}"</span>
                                    </div>
                                )}
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
