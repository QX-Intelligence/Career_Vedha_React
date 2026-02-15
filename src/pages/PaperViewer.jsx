import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaperViewer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const pdfUrl = searchParams.get('url');
    const title = searchParams.get('title');

    if (!pdfUrl) {
        return (
            <div className="paper-viewer-error">
                <div className="container">
                    <h2>No PDF URL provided</h2>
                    <button onClick={() => navigate('/')} className="back-btn">
                        <i className="fas fa-arrow-left"></i> Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="paper-viewer-page">
            <div className="paper-viewer-header">
                <div className="container">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    {title && <h1 className="paper-viewer-title">{title}</h1>}
                    <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="open-new-tab-btn"
                    >
                        <i className="fas fa-external-link-alt"></i> Open in New Tab
                    </a>
                </div>
            </div>
            
            <div className="paper-viewer-content">
                <iframe
                    src={pdfUrl}
                    title={title || 'PDF Viewer'}
                    className="pdf-iframe"
                    frameBorder="0"
                />
            </div>
        </div>
    );
};

export default PaperViewer;
