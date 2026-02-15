import React from 'react';
import './WatermarkedPDFViewer.css';

const WatermarkedPDFViewer = ({ url, watermarkText = "Career Vedha", title }) => {
    return (
        <div className="watermarked-pdf-viewer-v2">
            {/* THE WATERMARK OVERLAY - Fixed position relative to viewer */}
            <div className="pdf-watermark-overlay">
                <div className="watermark-pattern">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="watermark-item">
                            {watermarkText}
                        </div>
                    ))}
                </div>
            </div>

            {/* THE PDF CONTENT */}
            <div className="pdf-iframe-container">
                <iframe 
                    src={`${url}#toolbar=1&view=FitH`} 
                    title={`PDF: ${title}`}
                    width="100%"
                    height="800px"
                    frameBorder="0"
                    type="application/pdf"
                ></iframe>
            </div>

            <div className="pdf-actions-footer">
                <p className="pdf-info-hint">
                    <i className="fas fa-info-circle"></i> 
                    Use the toolbar inside the viewer to zoom or print.
                </p>
                <a 
                    href={url} 
                    download 
                    className="pdf-download-link"
                    title="Download Original"
                >
                    <i className="fas fa-download"></i> Download PDF
                </a>
            </div>
        </div>
    );
};

export default WatermarkedPDFViewer;
