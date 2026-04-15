import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { BookOpen, Download, Loader2, Package, Search, Star, X, Maximize2 } from 'lucide-react';
import inventoryApi from '../api/inventoryApi';
import { useSnackbar } from '../../../context/SnackbarContext';

const Module_Library = () => {
    const location = useLocation();
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightId, setHighlightId] = useState(location.state?.highlightId || null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        // Clear highlight after 10 seconds
        if (highlightId) {
            const timer = setTimeout(() => setHighlightId(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [highlightId]);

    useEffect(() => {
        const fetchPurchasedBooks = async () => {
            try {
                // Official endpoint now deduplicates and provides presigned URLs
                const res = await inventoryApi.get('/payment/my-books');
                setLibrary(res.data || []);
            } catch (err) {
                console.error("Failed to fetch library", err);
                showSnackbar("Failed to load your digital library.", "error");
                setLibrary([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPurchasedBooks();
    }, []);

    const handleDownload = async (book) => {
        try {
            setDownloading(book.bookId);
            
            // Use the dedicated backend download route to bypass S3 CORS
            const response = await inventoryApi.get(`/books/download/${book.bookId}`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `${book.bookName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            
            showSnackbar("Download completed!", "success");
        } catch (err) {
            console.error("Secure download failed", err);
            showSnackbar("Download failed. Please try again later.", "error");
        } finally {
            setDownloading(null);
        }
    };

    const openReader = (book) => {
        setPdfLoading(true);
        setSelectedBook(book);
    };

    const filteredLibrary = library.filter(book => 
        book.bookName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ padding: '15rem 0', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', color: '#0F172A' }}>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#62269e' }} />
            <p style={{ color: '#475569', fontSize: '1.2rem', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>Opening your digital library...</p>
        </div>
    );

    return (
        <div style={{ paddingTop: '8rem', paddingBottom: '5rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>My Library</h1>
                        <p style={{ color: '#94A3B8', fontSize: '1rem' }}>Your collection of purchased digital content.</p>
                    </div>
                    
                    <div className="store-search-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                        <input 
                            type="text" 
                            placeholder="Search content..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem 1rem 0.75rem 2.75rem', 
                                background: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '0.75rem', 
                                color: '#0F172A', 
                                fontSize: '0.9rem', 
                                outline: 'none', 
                                transition: 'all 0.2s ease' 
                            }}
                        />
                    </div>
                </div>

                {library.length === 0 ? (
                    <div style={{ padding: '6rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(98, 38, 158, 0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <BookOpen size={28} color="#62269e" />
                        </div>
                        <h2 style={{ color: '#0F172A', fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Your library is empty</h2>
                        <p style={{ color: '#475569', maxWidth: '350px', margin: '0 auto 2rem', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif" }}>Digital purchases will appear here automatically after payment confirmation.</p>
                        <Motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = '/e-store/shop'}
                            style={{ padding: '0.75rem 2rem', background: '#62269e', color: '#0F172A', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Browse Collection
                        </Motion.button>
                    </div>
                ) : filteredLibrary.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <p style={{ color: '#444', fontSize: '1rem' }}>No results for "{searchTerm}"</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                        {filteredLibrary.map((book) => (
                            <Motion.div 
                                key={book.bookId}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`lib-card ${Number(highlightId) === Number(book.bookId) ? 'highlighted' : ''}`}
                                style={{ 
                                    background: '#ffffff', 
                                    borderRadius: '1rem', 
                                    overflow: 'hidden', 
                                    border: Number(highlightId) === Number(book.bookId) ? '2px solid #62269e' : '1px solid #e2e8f0', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    position: 'relative',
                                    boxShadow: Number(highlightId) === Number(book.bookId) ? '0 0 30px rgba(98, 38, 158, 0.2)' : 'none'
                                }}
                            >
                                <div style={{ height: '280px', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
                                    {book.coverPhotoUrl ? (
                                        <img src={book.coverPhotoUrl} alt={book.bookName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="lib-img" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                                            <Package size={40} />
                                        </div>
                                    )}

                                    {Number(highlightId) === Number(book.bookId) && (
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#62269e', color: '#0F172A', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                            <Star size={12} fill="currentColor" /> NEWLY ADDED
                                        </div>
                                    )}
                                    {/* Action Overlay */}
                                    <div className="lib-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease', gap: '0.75rem' }}>
                                        <button 
                                            onClick={() => openReader(book)}
                                            style={{ 
                                                width: '160px',
                                                padding: '0.6rem', 
                                                background: '#62269e', 
                                                color: '#0F172A', 
                                                borderRadius: '0.5rem', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 800, 
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <BookOpen size={14} /> READ ONLINE
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownload(book); }}
                                            disabled={downloading === book.bookId}
                                            style={{ 
                                                width: '160px',
                                                padding: '0.6rem', 
                                                background: 'transparent', 
                                                color: '#62269e', 
                                                borderRadius: '0.5rem', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 800, 
                                                border: '1px solid rgba(98, 38, 158, 0.4)',
                                                cursor: downloading === book.bookId ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {downloading === book.bookId ? (
                                                <><Loader2 size={14} className="animate-spin" /> DOWNLOADING...</>
                                            ) : (
                                                <><Download size={14} /> SAVE PDF</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ padding: '1.25rem', flexGrow: 1 }}>
                                    <h3 style={{ color: '#0F172A', fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={book.bookName}>
                                        {book.bookName}
                                    </h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ color: '#62269e', fontSize: '0.75rem', fontWeight: 600 }}>{book.author || 'Career Vedha'}</p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>E-Book</p>
                                    </div>
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Reader Modal */}
            {selectedBook && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: 9999, 
                    background: 'rgba(0,0,0,0.95)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ 
                        padding: '1rem 2rem', 
                        background: '#FDFBF7', 
                        borderBottom: '1px solid #222', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(98, 38, 158, 0.12)', borderRadius: '0.5rem' }}>
                                <BookOpen size={20} color="#62269e" />
                            </div>
                            <div>
                                <h2 style={{ color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>{selectedBook.bookName}</h2>
                                <p style={{ color: '#555', fontSize: '0.75rem' }}>Secure Reading Mode</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button 
                                onClick={() => handleDownload(selectedBook)}
                                disabled={downloading === selectedBook.bookId}
                                style={{ 
                                    background: 'rgba(98, 38, 158, 0.12)', 
                                    border: '1px solid rgba(98, 38, 158, 0.3)', 
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '0.5rem', 
                                    color: '#62269e', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    cursor: downloading ? 'wait' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    opacity: downloading === selectedBook.bookId ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => !downloading && (e.target.style.background = 'rgba(98, 38, 158, 0.2)')}
                                onMouseLeave={(e) => !downloading && (e.target.style.background = 'rgba(98, 38, 158, 0.12)')}
                            >
                                {downloading === selectedBook.bookId ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> DOWNLOADING...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} /> DOWNLOAD PDF
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => setSelectedBook(null)}
                                style={{ 
                                    background: '#333', 
                                    border: 'none', 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    color: '#0F172A', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#ef4444'}
                                onMouseLeave={(e) => e.target.style.background = '#333'}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative', background: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {pdfLoading && (
                            <div style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                zIndex: 100, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                background: '#f8fafc',
                                backdropFilter: 'blur(5px)'
                            }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: 'rgba(98, 38, 158, 0.08)', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    marginBottom: '2rem',
                                    border: '1px solid rgba(98, 38, 158, 0.12)',
                                    boxShadow: '0 0 40px rgba(98, 38, 158, 0.1)'
                                }}>
                                    <Loader2 size={40} className="animate-spin" style={{ color: '#62269e' }} />
                                </div>
                                <h3 style={{ color: '#0F172A', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.02em' }}>Fetching Digital Assets</h3>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500 }}>Decrypting and rendering your secure document...</p>
                                
                                <div style={{ marginTop: '3rem', width: '200px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <Motion.div 
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, #62269e, transparent)' }}
                                    />
                                </div>
                            </div>
                        )}
                        <iframe 
                            src={`${selectedBook.pdfUrl}#toolbar=0`}
                            onLoad={() => {
                                // Add a tiny artificial delay to ensure PDF plugin is actually rendering
                                setTimeout(() => setPdfLoading(false), 500);
                            }}
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                border: 'none',
                                background: '#FFFFFF',
                                opacity: pdfLoading ? 0 : 1,
                                visibility: pdfLoading ? 'hidden' : 'visible',
                                transition: 'opacity 0.5s ease'
                            }}
                            title={selectedBook.bookName}
                        />
                        {/* Security Overlay to discourage right click if needed, though toolbar=0 handles some */}
                        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', padding: '0.75rem 1.5rem', background: 'rgba(98, 38, 158, 0.12)', borderRadius: '1rem', color: '#62269e', fontSize: '0.8rem', fontWeight: 800, border: '1px solid rgba(98, 38, 158, 0.2)', pointerEvents: 'none', fontFamily: "'Outfit', sans-serif" }}>
                            Career Vedha Secure View
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .lib-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .lib-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(98, 38, 158, 0.4);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                    background: #ffffff;
                }
                .lib-card.highlighted {
                    animation: pulse-glow 2s infinite;
                }
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 15px rgba(98, 38, 158, 0.1); border-color: rgba(98, 38, 158, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(98, 38, 158, 0.4); border-color: rgba(98, 38, 158, 0.9); }
                    100% { box-shadow: 0 0 15px rgba(98, 38, 158, 0.1); border-color: rgba(98, 38, 158, 0.3); }
                }
                .lib-card:hover .lib-overlay {
                    opacity: 1 !important;
                }
                .lib-card:hover .lib-img {
                    transform: scale(1.05);
                }
                .lib-overlay a:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(98, 38, 158, 0.4);
                }
            ` }} />
        </div>
    );
};

export default Module_Library;
