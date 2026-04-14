import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCache } from '../context/Cache_Context';
import inventoryApi from '../api/inventoryApi';

const Module_Entry = () => {
  const { add } = useCache();
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(products.length, 10)); // Limit to first 10
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [products.length]);

  const CATEGORY_LABELS = {
    'EBOOK': 'E-Books',
    'PHYSICAL': 'Physical Books',
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await inventoryApi.get('/books');
        const normalized = res.data.map(b => ({
          id: b.bookId,
          name: b.bookName,
          author: b.bookAuthor,
          description: b.bookDescription,
          price: b.bookPrice,
          image: b.coverPhotoUrl,
          category: b.bookCategory || 'OTHER',        // keep original casing for API
          language: b.languageCategory || '',
        }));
        setProducts(normalized);
      } catch (e) {
        console.error("Failed to fetch books", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const getCategoryLabel = (raw) => CATEGORY_LABELS[raw?.toUpperCase()] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Other');

  const categories = [
    { id: 'all', label: 'All Categories' },
    ...Array.from(new Set(products.map(p => p.category))).map(cat => ({
      id: cat,
      label: getCategoryLabel(cat)
    }))
  ];

  const filteredBooks = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const trendingBooks = products.slice(0, 8);
  const carouselBooks = products.slice(0, 10);
  const featuredBook = carouselBooks[currentIndex];

  if (loading) return (
    <div style={{ padding: '20rem 0', textAlign: 'center', background: '#FDFBF7', minHeight: '100vh', color: '#0F172A' }}>
      <Loader2 size={64} className="animate-spin" style={{ margin: '0 auto 2rem', color: '#62269E' }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem' }}>Loading Library...</h2>
    </div>
  );

  return (
    <div style={{ background: '#FDFBF7', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      {featuredBook && (
        <section style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          <AnimatePresence>
            <Motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img
                  src={featuredBook.image}
                  alt="Hero"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.3 }}
                />
              </div>

              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #FDFBF7 0%, rgba(253, 251, 247, 0.4) 100%)', zIndex: 1 }} />

              <h1 style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 'clamp(5rem, 15vw, 12rem)', fontWeight: 900, color: 'rgba(98, 38, 158, 0.05)', whiteSpace: 'nowrap', zIndex: 0, pointerEvents: 'none', textTransform: 'uppercase' }}>
                {featuredBook.name}
              </h1>

              <div className="store-hero-content" style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
                  <div style={{ maxWidth: '600px' }}>
                    <span style={{ color: '#62269E', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Available Now</span>
                    <Motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="store-hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3.5rem, 8vw, 7.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '1.5rem', lineHeight: 0.9, letterSpacing: '-2px' }}>
                      {featuredBook.name}
                    </Motion.h2>
                    <Motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ fontSize: '1.25rem', color: '#62269E', marginBottom: '1.5rem', fontWeight: 500 }}>By {featuredBook.author}</Motion.p>
                    <Motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, marginBottom: '2.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featuredBook.description}</Motion.p>

                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="store-hero-actions" style={{ display: 'flex', gap: '1.5rem' }}>
                        <button onClick={() => add(featuredBook)} style={{ padding: '1.25rem 3rem', background: '#62269E', color: '#FDFBF7', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 10px 30px rgba(98, 38, 158, 0.3)' }}>Buy Now • ₹{featuredBook.price}</button>
                        <Link to={`/e-store/view/${featuredBook.id}`} style={{ padding: '1.25rem 3rem', border: '1px solid #62269E', borderRadius: '0.75rem', color: '#62269E', textDecoration: 'none', fontWeight: 600, backdropFilter: 'blur(10px)', textAlign: 'center' }}>More Detail</Link>
                    </Motion.div>
                  </div>
                </div>
              </div>
            </Motion.div>
          </AnimatePresence>

          <div style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', zIndex: 10, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {carouselBooks.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: currentIndex === idx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentIndex === idx ? '#62269E' : 'rgba(98, 38, 158, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* TRENDS */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#0F172A' }}>Trending Now</h2>
          <Link to="/e-store/shop" style={{ color: '#62269E', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>View Collection <ArrowRight size={18} /></Link>
        </div>
        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '2rem', scrollbarWidth: 'none' }}>
          {trendingBooks.map((book) => (
            <Link to={`/e-store/view/${book.id}`} key={book.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <Motion.div whileHover={{ y: -10 }} style={{ width: '200px' }}>
                <img src={book.image} alt={book.name} style={{ width: '200px', height: '280px', objectFit: 'cover', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                <h4 style={{ fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.25rem' }}>{book.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{book.author}</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#62269E', marginTop: '0.5rem' }}>₹{book.price}</p>
              </Motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORY EXPLORER */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem 8rem' }}>
        <div style={{ borderTop: '1px solid #222', paddingTop: '5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#0F172A', marginBottom: '3rem' }}>Explore Categories</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.id)}
                style={{ 
                  padding: '1rem 2rem', 
                  background: activeCategory === cat.id ? '#62269E' : '#FFFFFF', 
                  color: activeCategory === cat.id ? '#FDFBF7' : '#888',
                  borderRadius: '100px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '3rem' }}>
            {filteredBooks.slice(0, 12).map((book) => (
              <Link to={`/e-store/view/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
                <Motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                  <img src={book.image} alt={book.name} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '1rem' }} />
                  <p style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{book.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#62269E', fontWeight: 600 }}>₹{book.price}</p>
                </Motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module_Entry;
