import React, { useState } from 'react';
import WatermarkedPDFViewer from '../common/WatermarkedPDFViewer';
import './ChapterMaterialsView.css';

const ChapterMaterialsView = ({ materials: inputMaterials, language, onStartExam, chapterName }) => {
    const [selectedDoc, setSelectedDoc] = useState(null);

    if (!inputMaterials) {
        return (
            <div className="materials-loading">
                <div className="spinner"></div>
                <p>Loading materials...</p>
            </div>
        );
    }

    // Handle blocks { chapter, materials }, arrays [], and paginated { content: [] }
    const materialList = Array.isArray(inputMaterials) ? inputMaterials : 
                        (inputMaterials.materials || inputMaterials.content || []);
    
    // WORKAROUND Logic:
    let intro = inputMaterials.introduction;
    let studyMaterialsList = inputMaterials.materials;

    // If it's a flat list from subject-blocks or material list workaround
    if (!intro && materialList.length > 0) {
        intro = materialList.find(m => m.material_type === 'CONTENT');
        // Do NOT filter out the intro material, because it might contain valid attachments/documents media
        studyMaterialsList = materialList;
    }

    // If still no intro, studyMaterials are just the list
    if (!studyMaterialsList) studyMaterialsList = materialList;
    
    // Resilient Translation Extraction
    const getTranslation = (mat) => {
        if (!mat) return null;
        if (mat.translations) {
            return mat.translations.find(t => t.language === language) || mat.translations[0];
        }
        // If pre-translated (prepare_material_card format)
        return {
            title: mat.title,
            summary: mat.content_preview, // map preview to summary
            content: mat.content_preview // fallback
        };
    };

    const introTranslation = getTranslation(intro);
    const chapterDisplayName = introTranslation?.title || inputMaterials.name || chapterName;

    // Resilient Media Extraction
    const getMediaByUsage = (mat, usages = []) => {
        if (!mat) return [];
        const links = mat.media_links || mat.media || [];
        const usageArray = Array.isArray(usages) ? usages : [usages];
        
        // Map from { url, usage } or { media_url, usage }
        return links
            .filter(m => usageArray.includes(m.usage))
            .map(m => ({
                id: m.id,
                url: m.media_url || m.url,
                usage: m.usage
            }));
    };
    
    // Media is now rendered inline, so we don't need a separate mapped banner section or modal logic
    
    return (
        <div className="chapter-materials-view">
            {/* Content Section */}
            <div className="materials-content-section">
                <div className="content-header">
                    <h1 className="chapter-title">{chapterDisplayName}</h1>
                </div>

                {/* 
                    LAYOUT FLOW: 
                    1. Title (already rendered above)
                    2. Image (Study Material Images)
                    3. Summary (Chapter Description)
                    4. PDF (Study Material PDFs)
                */}

                {/* 2. Image Section */}
                {studyMaterialsList.length > 0 && (
                    <div className="documents-section inline-mode images-only">
                        {studyMaterialsList.map((mat, mIdx) => {
                            const docs = getMediaByUsage(mat, ['DOCUMENT', 'content', 'ATTACHMENT']);
                            const matTranslation = getTranslation(mat);
                            const matTitle = matTranslation?.title || mat.title || mat.name || "Study Material";

                            return docs.map((doc, dIdx) => {
                                const lowerUrl = doc.url.toLowerCase();
                                const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(lowerUrl);
                                
                                if (!isImage) return null; // Skip non-images

                                return (
                                    <div key={`img-${mIdx}-${dIdx}`} className="inline-material-container" style={{ marginBottom: '2rem' }}>
                                        <h3 className="material-title" style={{ 
                                            fontSize: '1.2rem', 
                                            fontWeight: '700', 
                                            color: '#1e293b', 
                                            marginBottom: '1rem',
                                            paddingLeft: '0.5rem',
                                            borderLeft: '4px solid #facc15'
                                        }}>
                                            {matTitle} (Image)
                                        </h3>
                                        <div className="image-container" style={{ textAlign: 'left' }}>
                                            <img 
                                                src={doc.url} 
                                                alt={matTitle} 
                                                style={{ 
                                                    maxWidth: '600px',
                                                    width: '100%',
                                                    maxHeight: '600px', 
                                                    borderRadius: '12px', 
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })}
                    </div>
                )}

                {/* 3. Summary Section */}
                {(introTranslation?.content || introTranslation?.summary) ? (
                    <div className="chapter-description" style={{ margin: '2rem 0' }}>
                        {introTranslation.summary && <p className="summary-text" style={{ fontWeight: '600', marginBottom: '1rem' }}>{introTranslation.summary}</p>}
                        {introTranslation.content && introTranslation.content !== introTranslation.summary && (
                            <p>{introTranslation.content}</p>
                        )}
                    </div>
                ) : (
                    // Show "No Materials" only if we have NO materials at all AND no description
                    studyMaterialsList.length === 0 && (
                        <div className="no-materials-message">
                            <i className="fas fa-info-circle"></i>
                            <p>No study materials are available for this chapter yet.</p>
                        </div>
                    )
                )}

                {/* 4. PDF Section */}
                {studyMaterialsList.length > 0 && (
                    <div className="documents-section inline-mode pdfs-only">
                        {studyMaterialsList.map((mat, mIdx) => {
                            const docs = getMediaByUsage(mat, ['DOCUMENT', 'content', 'ATTACHMENT']);
                            const matTranslation = getTranslation(mat);
                            const matTitle = matTranslation?.title || mat.title || mat.name || "Study Material";

                            return docs.map((doc, dIdx) => {
                                const lowerUrl = doc.url.toLowerCase();
                                const isPdf = lowerUrl.includes('.pdf');
                                const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(lowerUrl);
                                
                                // Skip images (handled above)
                                if (isImage && !isPdf) return null;

                                return (
                                    <div key={`pdf-${mIdx}-${dIdx}`} className="inline-material-container" style={{ marginBottom: '3rem' }}>
                                        <h3 className="material-title" style={{ 
                                            fontSize: '1.2rem', 
                                            fontWeight: '700', 
                                            color: '#1e293b', 
                                            marginBottom: '1rem',
                                            paddingLeft: '0.5rem',
                                            borderLeft: '4px solid #facc15'
                                        }}>
                                            {matTitle} {isPdf ? '(PDF)' : ''}
                                        </h3>

                                        {isPdf ? (
                                            <WatermarkedPDFViewer url={doc.url} title={matTitle} />
                                        ) : (
                                            // Fallback for other types (non-image, non-pdf)
                                            <div className="document-card">
                                                <div className="doc-info">
                                                    <p className="doc-name">{doc.url.split('/').pop()}</p>
                                                    <a href={doc.url} download className="download-btn-mini">
                                                        <i className="fas fa-download"></i> Download
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })}
                    </div>
                )}



                <div className="exam-action-section">
                    <button className="start-exam-btn" onClick={onStartExam}>
                        <i className="fas fa-pen-fancy"></i>
                        Start Practice Test
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ChapterMaterialsView;
