import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BookModal = ({ isOpen, onClose, onSave, book = null }) => {
    const initialState = {
        bookName: '',
        bookAuthor: '',
        bookDescription: '',
        bookPrice: '',
        totalQuantity: '',
        bookCategory: 'PHYSICAL',
        languageCategory: 'ENGLISH',
        bookPublishDate: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initialState);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [ebookPdf, setEbookPdf] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (book) {
            setFormData({
                bookName: book.bookName || '',
                bookAuthor: book.bookAuthor || '',
                bookDescription: book.bookDescription || '',
                bookPrice: book.bookPrice || '',
                totalQuantity: book.totalQuantity || '',
                bookCategory: book.bookCategory || 'PHYSICAL',
                languageCategory: book.languageCategory || 'ENGLISH',
                bookPublishDate: book.bookPublishDate || new Date().toISOString().split('T')[0]
            });
        } else {
            setFormData(initialState);
        }
    }, [book, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'coverPhoto') setCoverPhoto(files[0]);
        if (name === 'ebookPdf') setEbookPdf(files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const data = new FormData();
            
            // For creating, backend expects a list of books (List<CreateEbookRequest>)
            // But for single add/edit, we'll format it based on the action
            if (book) {
                // Edit mode
                Object.keys(formData).forEach(key => data.append(key, formData[key]));
                if (coverPhoto) data.append('coverPhoto', coverPhoto);
                if (ebookPdf) data.append('ebookPdf', ebookPdf);
                await onSave(book.bookId, data);
            } else {
                // Add mode - CreateEbookRequest
                // Note: backend upload takes List<CreateEbookRequest>
                // We'll pass the form data up and let the parent handle the API call structure
                const uploadData = { ...formData, coverPhoto, ebookPdf };
                await onSave(null, uploadData);
            }
            onClose();
        } catch (error) {
            console.error("Form submission error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="um-modal-overlay">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="um-modal"
                    style={{ maxWidth: '600px', width: '90%' }}
                >
                    <div className="um-modal-header">
                        <h2 className="um-modal-title">
                            {book ? 'Edit Book' : 'Add New Book'}
                        </h2>
                        <button className="um-modal-close" onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="um-modal-body">
                        <div className="um-form-grid">
                            <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="um-label">Book Name</label>
                                <input 
                                    type="text" 
                                    name="bookName"
                                    className="um-input" 
                                    value={formData.bookName}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Author</label>
                                <input 
                                    type="text" 
                                    name="bookAuthor"
                                    className="um-input" 
                                    value={formData.bookAuthor}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Category</label>
                                <select 
                                    name="bookCategory"
                                    className="um-input"
                                    value={formData.bookCategory}
                                    onChange={handleChange}
                                >
                                    <option value="PHYSICAL">Physical Book</option>
                                    <option value="EBOOK">E-Book (PDF)</option>
                                </select>
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Price (₹)</label>
                                <input 
                                    type="number" 
                                    name="bookPrice"
                                    className="um-input" 
                                    value={formData.bookPrice}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Quantity</label>
                                <input 
                                    type="number" 
                                    name="totalQuantity"
                                    className="um-input" 
                                    value={formData.totalQuantity}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Language</label>
                                <select 
                                    name="languageCategory"
                                    className="um-input"
                                    value={formData.languageCategory}
                                    onChange={handleChange}
                                >
                                    <option value="ENGLISH">English</option>
                                    <option value="HINDI">Hindi</option>
                                    <option value="TELUGU">Telugu</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Publish Date</label>
                                <input 
                                    type="date" 
                                    name="bookPublishDate"
                                    className="um-input" 
                                    value={formData.bookPublishDate}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>

                            <div className="um-form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="um-label">Description</label>
                                <textarea 
                                    name="bookDescription"
                                    className="um-input" 
                                    rows="3"
                                    value={formData.bookDescription}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="um-form-group">
                                <label className="um-label">Cover Photo {book && '(Optional)'}</label>
                                <input 
                                    type="file" 
                                    name="coverPhoto"
                                    className="um-input" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required={!book}
                                />
                            </div>

                            {formData.bookCategory === 'EBOOK' && (
                                <div className="um-form-group">
                                    <label className="um-label">E-Book PDF {book && '(Optional)'}</label>
                                    <input 
                                        type="file" 
                                        name="ebookPdf"
                                        className="um-input" 
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        required={!book}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="um-modal-footer">
                            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className="um-btn-save" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                ) : (
                                    book ? 'Update Book' : 'Add Book'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookModal;
