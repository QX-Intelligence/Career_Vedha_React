import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionPaperService } from '../services';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import '../styles/contact-papers.css';

const StudyMaterialsPage = () => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });

    const fetchMaterials = async (loadMore = false) => {
        setIsLoading(true);
        try {
            const data = await questionPaperService.getPapersByCategory(
                'MATERIAL',
                loadMore ? cursor : null,
                20
            );
            
            if (loadMore) {
                setMaterials(prev => [...prev, ...data]);
            } else {
                setMaterials(data);
            }
            
            // Set cursor for next page (last item's creationDate)
            if (data.length > 0) {
                setCursor(data[data.length - 1].creationDate);
                setHasMore(data.length === 20);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filteredMaterials = materials.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <Header 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                activeLanguage={activeLanguage}
                setActiveLanguage={setActiveLanguage}
            />
            <PrimaryNav 
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            
            <div className="papers-page">
                <div className="papers-hero">
                    <div className="container">
                        <h1>Study Materials</h1>
                        <p>Download comprehensive study materials for exam preparation</p>
                    </div>
                </div>

                <div className="container">
                    <div className="papers-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search study materials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="papers-count">
                            {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'} found
                        </div>
                    </div>

                    {isLoading && materials.length === 0 ? (
                        <div className="papers-loading">
                            <i className="fas fa-spinner fa-spin"></i> Loading materials...
                        </div>
                    ) : filteredMaterials.length > 0 ? (
                        <>
                            <div className="papers-grid-large">
                                {filteredMaterials.map((material) => (
                                    <Link
                                        to={`/paper-viewer?url=${encodeURIComponent(material.presignedUrl)}&title=${encodeURIComponent(material.title)}`}
                                        key={material.id}
                                        className="paper-card-large"
                                    >
                                        <div className="paper-icon material-icon">
                                            <i className="fas fa-book"></i>
                                        </div>
                                        <span className="paper-title">{material.title}</span>
                                        {material.description && (
                                            <span className="paper-description">{material.description}</span>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {hasMore && !searchTerm && (
                                <div className="load-more-container">
                                    <button
                                        onClick={() => fetchMaterials(true)}
                                        className="load-more-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Loading...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-arrow-down"></i> Load More
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="papers-empty">
                            <i className="fas fa-folder-open"></i>
                            <p>
                                {searchTerm
                                    ? `No materials found matching "${searchTerm}"`
                                    : 'No study materials available at the moment.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </>
    );
};

export default StudyMaterialsPage;
