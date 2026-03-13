import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkUploadModal = ({ isOpen, onClose, onSave }) => {
    const [rows, setRows] = useState([
        { id: Date.now(), bookName: '', bookAuthor: '', bookPrice: '', totalQuantity: '', bookCategory: 'PHYSICAL', coverPhoto: null, ebookPdf: null }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRow = () => {
        setRows([...rows, { 
            id: Date.now(), 
            bookName: '', 
            bookAuthor: '', 
            bookPrice: '', 
            totalQuantity: '', 
            bookCategory: 'PHYSICAL', 
            coverPhoto: null, 
            ebookPdf: null 
        }]);
    };

    const removeRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const handleInputChange = (id, field, value) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleFileChange = (id, field, file) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: file } : row));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            rows.forEach((row, index) => {
                formData.append(`books[${index}].bookName`, row.bookName);
                formData.append(`books[${index}].bookAuthor`, row.bookAuthor);
                formData.append(`books[${index}].bookPrice`, row.bookPrice);
                formData.append(`books[${index}].totalQuantity`, row.totalQuantity);
                formData.append(`books[${index}].bookCategory`, row.bookCategory);
                formData.append(`books[${index}].languageCategory`, 'ENGLISH');
                formData.append(`books[${index}].bookPublishDate`, new Date().toISOString().split('T')[0]);
                
                if (row.coverPhoto) {
                    formData.append(`books[${index}].coverPhoto`, row.coverPhoto);
                }
                if (row.bookCategory === 'EBOOK' && row.ebookPdf) {
                    formData.append(`books[${index}].ebookPdf`, row.ebookPdf);
                }
            });

            await onSave(formData);
            onClose();
            setRows([{ id: Date.now(), bookName: '', bookAuthor: '', bookPrice: '', totalQuantity: '', bookCategory: 'PHYSICAL', coverPhoto: null, ebookPdf: null }]);
        } catch (error) {
            console.error("Bulk upload failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="um-modal-overlay">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="um-modal"
                    style={{ maxWidth: '850px', width: '95%' }}
                >
                    <div className="um-modal-header">
                        <div className="um-modal-title-desc">
                            <h2 className="um-modal-title">Bulk Upload Inventory</h2>
                            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', margin: '4px 0 0' }}>Add multiple books to your store at once</p>
                        </div>
                        <button className="um-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
                    </div>

                    <form onSubmit={handleSubmit} className="um-modal-body" style={{ background: 'var(--slate-50)', padding: '1.5rem' }}>
                        <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {rows.map((row, index) => (
                                <motion.div 
                                    key={row.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="um-bulk-card"
                                >
                                    <div className="um-bulk-card-header">
                                        <div className="um-bulk-card-index">#{index + 1}</div>
                                        <button 
                                            type="button" 
                                            className="um-remove-card-btn"
                                            onClick={() => removeRow(row.id)}
                                            disabled={rows.length === 1}
                                            title="Remove Book"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>

                                    <div className="um-form-grid">
                                        <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="um-label">Book Name</label>
                                            <input 
                                                type="text" 
                                                className="um-input" 
                                                placeholder="Enter full book title"
                                                value={row.bookName}
                                                onChange={(e) => handleInputChange(row.id, 'bookName', e.target.value)}
                                                required 
                                            />
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-label">Author</label>
                                            <input 
                                                type="text" 
                                                className="um-input" 
                                                placeholder="Author name"
                                                value={row.bookAuthor}
                                                onChange={(e) => handleInputChange(row.id, 'bookAuthor', e.target.value)}
                                                required 
                                            />
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-label">Category</label>
                                            <select 
                                                className="um-input"
                                                value={row.bookCategory}
                                                onChange={(e) => handleInputChange(row.id, 'bookCategory', e.target.value)}
                                            >
                                                <option value="PHYSICAL">Physical Book</option>
                                                <option value="EBOOK">E-Book (Digital PDF)</option>
                                            </select>
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-label">Price (₹)</label>
                                            <input 
                                                type="number" 
                                                className="um-input" 
                                                placeholder="Selling price"
                                                value={row.bookPrice}
                                                onChange={(e) => handleInputChange(row.id, 'bookPrice', e.target.value)}
                                                required 
                                            />
                                        </div>

                                        <div className="um-form-group">
                                            <label className="um-label">Stock Quantity</label>
                                            <input 
                                                type="number" 
                                                className="um-input" 
                                                placeholder="Available qty"
                                                value={row.totalQuantity}
                                                onChange={(e) => handleInputChange(row.id, 'totalQuantity', e.target.value)}
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div className="um-file-upload-grid">
                                        <div className="um-file-upload-box">
                                            <label className="um-file-label">Book Cover Image</label>
                                            <div className={`um-file-input-wrapper ${row.coverPhoto ? 'active' : ''}`}>
                                                <i className={`fas ${row.coverPhoto ? 'fa-check' : 'fa-image'} um-file-icon`}></i>
                                                <div className="um-file-info">
                                                    {row.coverPhoto ? row.coverPhoto.name : 'Select Cover Photo'}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(row.id, 'coverPhoto', e.target.files[0])}
                                                    required={!row.coverPhoto}
                                                />
                                            </div>
                                        </div>

                                        {row.bookCategory === 'EBOOK' && (
                                            <div className="um-file-upload-box">
                                                <label className="um-file-label">E-Book PDF File</label>
                                                <div className={`um-file-input-wrapper ${row.ebookPdf ? 'active' : ''}`}>
                                                    <i className={`fas ${row.ebookPdf ? 'fa-check' : 'fa-file-pdf'} um-file-icon`}></i>
                                                    <div className="um-file-info">
                                                        {row.ebookPdf ? row.ebookPdf.name : 'Select PDF File'}
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf"
                                                        onChange={(e) => handleFileChange(row.id, 'ebookPdf', e.target.files[0])}
                                                        required={!row.ebookPdf}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="button" 
                                className="um-add-row-btn" 
                                onClick={addRow}
                            >
                                <i className="fas fa-plus"></i> Add Another Book Entry
                            </motion.button>
                        </div>

                        <div className="um-modal-footer" style={{ marginTop: '2rem', padding: '1.5rem 0 0', background: 'transparent' }}>
                            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={isSubmitting}>
                                Close
                            </button>
                            <button type="submit" className="um-btn-save" disabled={isSubmitting} style={{ padding: '0.75rem 2.5rem' }}>
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                                ) : (
                                    <>Upload {rows.length} {rows.length === 1 ? 'Book' : 'Books'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BulkUploadModal;
