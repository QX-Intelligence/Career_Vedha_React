import React, { useState, useEffect } from 'react';
import inventoryApi from '../../api/inventoryApi';
import { useSnackbar } from '../../../../context/SnackbarContext';
import BookModal from '../components/BookModal';
import BulkUploadModal from '../components/BulkUploadModal';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const { showSnackbar } = useSnackbar();

    const fetchAllBooks = async () => {
        setLoading(true);
        try {
            const [activeRes, inactiveRes] = await Promise.all([
                inventoryApi.get('books'),
                inventoryApi.get('admin/ebooks/inactive')
            ]);
            
            const allBooks = [
                ...(activeRes.data || []).map(b => ({ ...b, status: 'ACTIVE' })),
                ...(inactiveRes.data || []).map(b => ({ ...b, status: 'INACTIVE' }))
            ].sort((a, b) => b.bookId - a.bookId);

            setBooks(allBooks);
        } catch (err) {
            console.error("Failed to fetch books", err);
            showSnackbar("Failed to load inventory", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBooks();
    }, []);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(books.map(b => b.bookId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) return;
        try {
            const endpoint = newStatus === 'ACTIVE' ? 'admin/ebooks/activate' : 'admin/ebooks/deactivate';
            await inventoryApi.put(endpoint, selectedIds);
            showSnackbar(`${selectedIds.length} Books ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} Successfully`, "success");
            setSelectedIds([]);
            fetchAllBooks();
        } catch (err) {
            console.error("Bulk status update failed", err);
            showSnackbar("Bulk action failed", "error");
        }
    };

    const toggleStatus = async (bookId, currentStatus) => {
        try {
            const endpoint = currentStatus === 'ACTIVE' ? 'admin/ebooks/deactivate' : 'admin/ebooks/activate';
            await inventoryApi.put(endpoint, [bookId]);
            showSnackbar(`Book ${currentStatus === 'ACTIVE' ? 'Deactivated' : 'Activated'} Successfully`, "success");
            fetchAllBooks();
        } catch (err) {
            console.error("Status toggle failed", err);
            showSnackbar("Failed to update status", "error");
        }
    };

    const handleAddClick = () => {
        setEditingBook(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (book) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleSaveBook = async (bookId, data) => {
        try {
            if (bookId) {
                await inventoryApi.put(`admin/ebooks/${bookId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSnackbar("Book updated successfully", "success");
            } else {
                const formData = new FormData();
                Object.keys(data).forEach(key => {
                    if (data[key] !== null && data[key] !== undefined) {
                        formData.append(`books[0].${key}`, data[key]);
                    }
                });

                await inventoryApi.post('admin/ebooks/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSnackbar("Book added successfully", "success");
            }
            fetchAllBooks();
        } catch (err) {
            console.error("Failed to save book", err);
            showSnackbar(err.response?.data?.message || "Failed to save book", "error");
            throw err;
        }
    };

    const handleBulkSave = async (formData) => {
        try {
            await inventoryApi.post('admin/ebooks/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSnackbar("Bulk upload successful", "success");
            fetchAllBooks();
        } catch (err) {
            console.error("Bulk upload failed", err);
            showSnackbar(err.response?.data?.message || "Bulk upload failed", "error");
            throw err;
        }
    };

    if (loading) return <div className="um-loading"><div className="um-spinner"></div><p>Loading Inventory...</p></div>;

    return (
        <div className="admin-books-container">
            <div className="um-header">
                <div className="um-header-content">
                    <div className="um-title-section">
                        <h1 className="um-title">
                            <i className="fas fa-book"></i>
                            Inventory Management
                        </h1>
                        <p className="um-subtitle">Manage your E-Store books</p>
                    </div>
                    <div className="um-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            className="um-btn-cancel"
                            onClick={() => setIsBulkModalOpen(true)}
                            style={{ background: 'white', color: 'var(--slate-700)' }}
                        >
                            <i className="fas fa-file-upload"></i> Bulk Upload
                        </button>
                        <button 
                            className="um-btn-save"
                            onClick={handleAddClick}
                        >
                            <i className="fas fa-plus"></i> Add New Book
                        </button>
                    </div>
                </div>
            </div>

            <div className="um-table-container">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === books.length && books.length > 0}
                                />
                            </th>
                            <th>Book ID</th>
                            <th>Cover</th>
                            <th>Title & Author</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="um-empty-state">
                                    <i className="fas fa-inbox"></i>
                                    <p>No books found in inventory</p>
                                </td>
                            </tr>
                        ) : (
                            books.map((book) => (
                                <tr key={book.bookId} className={`um-table-row ${selectedIds.includes(book.bookId) ? 'selected' : ''}`}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(book.bookId)}
                                            onChange={() => handleSelectOne(book.bookId)}
                                        />
                                    </td>
                                    <td className="um-book-id">#{book.bookId}</td>
                                    <td>
                                        <div className="um-book-cover">
                                            {book.coverPhotoUrl ? (
                                                <img src={book.coverPhotoUrl} alt="cover" />
                                            ) : (
                                                <div className="um-cover-placeholder">
                                                    <i className="fas fa-image"></i>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="um-book-details">
                                            <span className="um-book-name">{book.bookName}</span>
                                            <span className="um-book-author">{book.bookAuthor}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="um-role-badge">
                                            {book.bookCategory || 'OTHER'}
                                        </span>
                                    </td>
                                    <td className="um-book-price">
                                        ₹{book.bookPrice}
                                    </td>
                                    <td>
                                        <span className={`um-status-badge ${book.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                                            <i className={`fas ${book.status === 'ACTIVE' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                            {book.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="um-action-buttons">
                                            <button
                                                className={`um-action-btn ${book.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                                                onClick={() => toggleStatus(book.bookId, book.status)}
                                                title={book.status === 'ACTIVE' ? "Deactivate Book" : "Activate Book"}
                                            >
                                                <i className={`fas ${book.status === 'ACTIVE' ? 'fa-ban' : 'fa-check'}`}></i>
                                            </button>
                                            <button 
                                                className="um-action-btn edit" 
                                                title="Edit Book" 
                                                onClick={() => handleEditClick(book)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="um-bulk-bar"
                    >
                        <div className="um-bulk-content">
                            <span><strong>{selectedIds.length}</strong> books selected</span>
                            <div className="um-bulk-actions">
                                <button onClick={() => handleBulkStatusUpdate('ACTIVE')} className="um-btn-save">
                                    <i className="fas fa-check"></i> Bulk Activate
                                </button>
                                <button onClick={() => handleBulkStatusUpdate('INACTIVE')} className="um-btn-cancel" style={{ background: '#ef4444', color: 'white' }}>
                                    <i className="fas fa-ban"></i> Bulk Deactivate
                                </button>
                                <button onClick={() => setSelectedIds([])} className="um-btn-text">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BookModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveBook}
                book={editingBook}
            />

            <BulkUploadModal 
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleBulkSave}
            />
        </div>
    );
};

export default AdminBooks;
