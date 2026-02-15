import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { globalSearchService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import '../styles/SearchResults.css';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [resultsByType, setResultsByType] = useState({});
    const [activeLanguage, setActiveLanguage] = useState('telugu');

    useEffect(() => {
        performSearch();
    }, [query, activeFilter]);

    const performSearch = async () => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const types = activeFilter === 'all' ? ['all'] : [activeFilter];
            const searchResponse = await globalSearchService.searchAll(query, types);
            
            setResults(searchResponse.results);
            setResultsByType(searchResponse.resultsByType);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            article: 'Article',
            job: 'Job',
            paper: 'Question Paper',
            currentAffair: 'Current Affairs'
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type) => {
        const icons = {
            article: 'fa-newspaper',
            job: 'fa-briefcase',
            paper: 'fa-file-pdf',
            currentAffair: 'fa-calendar-day'
        };
        return icons[type] || 'fa-file';
    };

    const handleResultClick = (result) => {
        if (result.type === 'paper') {
            window.open(result.url, '_blank');
        } else {
            navigate(result.url);
        }
    };

    const filteredResults = activeFilter === 'all' 
        ? results 
        : results.filter(r => r.type === activeFilter || 
            (activeFilter === 'currentAffairs' && r.type === 'currentAffair'));

    return (
        <div className="page-wrapper">
            <Header 
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
            />
            <PrimaryNav activeLanguage={activeLanguage} />

            <div className="search-results-page">
                <div className="search-results-container">
                    {/* Header */}
                    <div className="search-header">
                        <h1>
                            <i className="fas fa-search"></i>
                            Search Results
                        </h1>
                        <p className="search-query">
                            Showing results for: <strong>"{query}"</strong>
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="search-filters">
                        <button
                            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            <i className="fas fa-globe"></i>
                            All Results
                            {resultsByType && (
                                <span className="count">{results.length}</span>
                            )}
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === 'article' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('article')}
                        >
                            <i className="fas fa-newspaper"></i>
                            Articles
                            <span className="count">{resultsByType.articles || 0}</span>
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === 'jobs' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('jobs')}
                        >
                            <i className="fas fa-briefcase"></i>
                            Jobs
                            <span className="count">{resultsByType.jobs || 0}</span>
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === 'papers' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('papers')}
                        >
                            <i className="fas fa-file-pdf"></i>
                            Papers
                            <span className="count">{resultsByType.papers || 0}</span>
                        </button>
                        <button
                            className={`filter-btn ${activeFilter === 'currentAffairs' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('currentAffairs')}
                        >
                            <i className="fas fa-calendar-day"></i>
                            Current Affairs
                            <span className="count">{resultsByType.currentAffairs || 0}</span>
                        </button>
                    </div>

                    {/* Results */}
                    <div className="search-results-content">
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Searching...</p>
                            </div>
                        ) : filteredResults.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-search empty-icon"></i>
                                <h3>No results found</h3>
                                <p>Try different keywords or filters</p>
                            </div>
                        ) : (
                            <div className="results-grid">
                                {filteredResults.map((result, index) => (
                                    <div
                                        key={`${result.type}-${result.id}-${index}`}
                                        className="result-card"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="result-header">
                                            <span className={`type-badge badge-${result.type}`}>
                                                <i className={`fas ${getTypeIcon(result.type)}`}></i>
                                                {getTypeLabel(result.type)}
                                            </span>
                                            {result.publishedAt && (
                                                <span className="result-date">
                                                    {new Date(result.publishedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {result.image && (
                                            <div className="result-image">
                                                <img src={result.image} alt={result.title} />
                                            </div>
                                        )}

                                        <div className="result-body">
                                            <h3 className="result-title">{result.title}</h3>
                                            {result.summary && (
                                                <p className="result-summary">
                                                    {result.summary.substring(0, 150)}...
                                                </p>
                                            )}
                                            {result.description && (
                                                <p className="result-summary">
                                                    {result.description.substring(0, 150)}...
                                                </p>
                                            )}
                                            {result.company && (
                                                <p className="result-meta">
                                                    <i className="fas fa-building"></i>
                                                    {result.company}
                                                </p>
                                            )}
                                            {result.location && (
                                                <p className="result-meta">
                                                    <i className="fas fa-map-marker-alt"></i>
                                                    {result.location}
                                                </p>
                                            )}
                                        </div>

                                        <div className="result-footer">
                                            <span className="view-link">
                                                View Details <i className="fas fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer activeLanguage={activeLanguage} />
        </div>
    );
};

export default SearchResults;
