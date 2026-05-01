import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PreviewModal - Lightbox to preview images or PDFs.
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Close handler
 * @param {string} url - Presigned S3 URL of the resource
 * @param {'image'|'pdf'} type - Type of content to preview
 * @param {string} title - Title shown in the header
 */
const PreviewModal = ({ isOpen, onClose, url, type = 'image', title = 'Preview' }) => {
    if (!isOpen || !url) return null;

    return (
        <AnimatePresence>
            <div className="um-modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        width: type === 'pdf' ? '90%' : 'auto',
                        maxWidth: type === 'pdf' ? '900px' : '700px',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--slate-100)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <i className={`fas ${type === 'pdf' ? 'fa-file-pdf' : 'fa-image'}`}
                                style={{
                                    color: type === 'pdf' ? '#ef4444' : '#62269e',
                                    fontSize: '1.1rem'
                                }}
                            />
                            <span style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--slate-900)',
                            }}>
                                {title}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--slate-200)',
                                    background: 'var(--slate-50)',
                                    color: 'var(--slate-600)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#62269e';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.borderColor = '#62269e';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--slate-50)';
                                    e.currentTarget.style.color = 'var(--slate-600)';
                                    e.currentTarget.style.borderColor = 'var(--slate-200)';
                                }}
                            >
                                <i className="fas fa-external-link-alt" />
                            </a>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--slate-200)',
                                    background: 'var(--slate-50)',
                                    color: 'var(--slate-500)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--slate-50)';
                                    e.currentTarget.style.color = 'var(--slate-500)';
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: type === 'pdf' ? '#f1f5f9' : '#f8fafc',
                        padding: type === 'pdf' ? 0 : '1.5rem',
                    }}>
                        {type === 'image' ? (
                            <img
                                src={url}
                                alt={title}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                            />
                        ) : (
                            <iframe
                                src={url}
                                title={title}
                                style={{
                                    width: '100%',
                                    height: '70vh',
                                    border: 'none',
                                }}
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PreviewModal;
