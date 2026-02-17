import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionPaperService } from '../../services';

const PreviousPapers = () => {
    const [papers, setPapers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch limited preview of both categories
                const [papersData, materialsData] = await Promise.all([
                    questionPaperService.getPapersByCategory('QUESTIONPAPER', null, 6),
                    questionPaperService.getPapersByCategory('MATERIAL', null, 6)
                ]);
                setPapers(Array.isArray(papersData) ? papersData : (papersData?.results || papersData?.content || []));
                setMaterials(Array.isArray(materialsData) ? materialsData : (materialsData?.results || materialsData?.content || []));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <section className="previous-papers">
            <div className="container">
                <h2 className="section-title">Resources</h2>

                {/* Question Papers Section */}
                <div className="resource-section">
                    <div className="section-header-flex">
                        <h3 className="subsection-title">
                            <i className="fas fa-file-pdf"></i> Question Papers
                        </h3>
                        <Link to="/question-papers" className="view-all-link">
                            View All <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="papers-loading">
                            <i className="fas fa-spinner fa-spin"></i> Loading...
                        </div>
                    ) : papers.length > 0 ? (
                        <div className="papers-grid">
                            {papers.map((paper) => (
                                <Link
                                    to={`/paper-viewer?url=${encodeURIComponent(paper.presignedUrl)}&title=${encodeURIComponent(paper.title)}`}
                                    key={paper.id}
                                    className="paper-card"
                                >
                                    <div className="paper-icon">
                                        <i className="fas fa-file-pdf"></i>
                                    </div>
                                    <span className="paper-title">{paper.title}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="papers-empty">
                            <p>No question papers available.</p>
                        </div>
                    )}
                </div>

                {/* Study Materials Section */}
                <div className="resource-section">
                    <div className="section-header-flex">
                        <h3 className="subsection-title">
                            <i className="fas fa-book"></i> Study Materials
                        </h3>
                        <Link to="/study-materials" className="view-all-link">
                            View All <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="papers-loading">
                            <i className="fas fa-spinner fa-spin"></i> Loading...
                        </div>
                    ) : materials.length > 0 ? (
                        <div className="papers-grid">
                            {materials.map((material) => (
                                <Link
                                    to={`/paper-viewer?url=${encodeURIComponent(material.presignedUrl)}&title=${encodeURIComponent(material.title)}`}
                                    key={material.id}
                                    className="paper-card"
                                >
                                    <div className="paper-icon material-icon">
                                        <i className="fas fa-book"></i>
                                    </div>
                                    <span className="paper-title">{material.title}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="papers-empty">
                            <p>No study materials available.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PreviousPapers;
