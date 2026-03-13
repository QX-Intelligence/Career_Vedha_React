import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, ShoppingBag, Truck, ShieldCheck, RotateCcw, BookOpen, Loader2, MessageCircle } from 'lucide-react';
import { useCache } from '../context/Cache_Context';
import inventoryApi from '../api/inventoryApi';

const WHATSAPP_NUMBER = '918790699260';

const Module_View = () => {
  const { id } = useParams();
  const { add } = useCache();
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const openWhatsApp = (product) => {
    const productUrl = `${window.location.origin}/e-store/view/${product.id}`;
    const msg = encodeURIComponent(
      `Hi! I'm interested in buying the physical book *"${product.name}"* by ${product.author} (₹${product.price}).

🔗 Product Link: ${productUrl}

Could you please guide me on how to proceed with the purchase?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const CATEGORY_LABELS = {
    'EBOOK': 'E-Books',
    'PHYSICAL': 'Physical Books',
  };
  const getCategoryLabel = (raw) => CATEGORY_LABELS[raw?.toUpperCase()] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Other');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await inventoryApi.get('/books');
        const allBooks = res.data.map(b => ({
          id: b.bookId,
          name: b.bookName,
          author: b.bookAuthor,
          description: b.bookDescription,
          price: b.bookPrice,
          image: b.coverPhotoUrl,
          category: b.bookCategory || 'OTHER',   // keep original casing
          language: b.languageCategory || '',
        }));
        
        const found = allBooks.find(p => p.id?.toString() === id?.toString());
        setProduct(found);
        
        if (found) {
          setRelatedBooks(allBooks.filter(p => p.category === found.category && p.id !== found.id).slice(0, 4));
        }
      } catch (e) {
        console.error("Error fetching book details", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div style={{ padding: '15rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
      <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#D4A843' }} />
      <p style={{ color: '#666', fontSize: '1.2rem' }}>Opening the vault...</p>
    </div>
  );

  if (!product) return <div style={{ color: '#fff', padding: '10rem', textAlign: 'center', background: '#111', minHeight: '100vh' }}>Book Not Found</div>;

  return (
    <div style={{ paddingTop: '7rem', paddingBottom: '5rem', background: '#111', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 1.5rem' }}>
        <Link to="/e-store/shop" style={{ color: '#888', marginBottom: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'color 0.2s' }}>
          <ArrowLeft size={16} /> Back to Collection
        </Link>
        
        <div className="store-view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', marginBottom: '6rem' }}>
          <div style={{ position: 'sticky', top: '10rem', height: 'fit-content' }}>
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#1a1a1a', padding: '3rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', maxWidth: '300px', borderRadius: '0.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', transform: 'rotate(-2deg)' }} />
            </Motion.div>
          </div>

          <div>
            <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.4rem 1rem', background: 'rgba(212, 168, 67, 0.1)', color: '#D4A843', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {getCategoryLabel(product.category)}
                </span>
                {product.language && (
                  <span style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#888', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {product.language}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: '#fff', marginBottom: '0.75rem', lineHeight: 1.1 }}>{product.name}</h1>
              <p style={{ color: '#D4A843', fontSize: '1.25rem', fontWeight: 500, marginBottom: '2rem' }}>By {product.author}</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>₹{product.price}</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                {product.category?.toUpperCase() === 'PHYSICAL' ? (
                  <button 
                    onClick={() => openWhatsApp(product)} 
                    style={{ 
                      flexGrow: 1, 
                      padding: '1.25rem', 
                      background: 'linear-gradient(135deg, #25D366, #128C7E)', 
                      border: 'none', 
                      borderRadius: '0.75rem', 
                      fontWeight: 700, 
                      fontSize: '1rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem', 
                      color: '#fff',
                      boxShadow: '0 10px 20px rgba(37, 211, 102, 0.25)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <MessageCircle size={22} /> Order via WhatsApp
                  </button>
                ) : (
                  <button onClick={() => add(product)} style={{ flexGrow: 1, padding: '1.25rem', background: '#D4A843', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 10px 20px rgba(212, 168, 67, 0.2)' }}>
                    <ShoppingBag size={20} /> Add to Cart
                  </button>
                )}
              </div>

              <div className="store-view-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1.5rem', background: '#1a1a1a', borderRadius: '1rem', marginBottom: '3rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Truck size={18} color="#D4A843" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.7rem', color: '#888' }}>Free Shipping</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ShieldCheck size={18} color="#D4A843" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.7rem', color: '#888' }}>Secure Payment</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <RotateCcw size={18} color="#D4A843" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.7rem', color: '#888' }}>7 Day Returns</p>
                </div>
              </div>
            </Motion.div>

            <div style={{ borderBottom: '1px solid #222', display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              {['description', 'details'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #D4A843' : '2px solid transparent', color: activeTab === tab ? '#fff' : '#666', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <Motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ color: '#aaa', lineHeight: 1.8, fontSize: '0.95rem' }}>
                {activeTab === 'description' && (
                  <p>{product.description}</p>
                )}
                {activeTab === 'details' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={14} /> <strong>Format:</strong> Digital / E-book</p>
                    </div>
                  </div>
                )}
              </Motion.div>
            </AnimatePresence>
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <section style={{ borderTop: '1px solid #222', paddingTop: '5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#fff', marginBottom: '2.5rem' }}>You Might Also Like</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
              {relatedBooks.map((book) => (
                <Link to={`/e-store/view/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
                  <Motion.div whileHover={{ y: -10 }} style={{ background: '#1a1a1a', borderRadius: '1rem', overflow: 'hidden', transition: 'all 0.3s' }}>
                    <img src={book.image} alt={book.name} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>{book.author}</p>
                      <span style={{ fontWeight: 700, color: '#D4A843' }}>₹{book.price}</span>
                    </div>
                  </Motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Module_View;
