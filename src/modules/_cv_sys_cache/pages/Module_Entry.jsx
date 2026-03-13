import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCache } from '../context/Cache_Context';
import inventoryApi from '../api/inventoryApi';

const Module_Entry = () => {
  const { add } = useCache();
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const featuredBook = products[0];

  if (loading) return (
    <div style={{ padding: '20rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
      <Loader2 size={64} className="animate-spin" style={{ margin: '0 auto 2rem', color: '#D4A843' }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem' }}>Loading Library...</h2>
    </div>
  );

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      {featuredBook && (
        <section style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img
              src={featuredBook.image}
              alt="Hero"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.3 }}
            />
          </div>

          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(17,17,17,1) 0%, rgba(17,17,17,0.4) 100%)', zIndex: 1 }} />

          <div className="store-hero-content" style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '10rem 1.5rem 4rem', width: '100%' }}>
            <div style={{ maxWidth: '600px' }}>
              <span style={{ color: '#D4A843', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Recently Added</span>
              <Motion.h1 className="store-hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#fff', marginBottom: '1rem', lineHeight: 1.1 }}>
                {featuredBook.name}
              </Motion.h1>
              <p style={{ fontSize: '1.25rem', color: '#D4A843', marginBottom: '1.5rem', fontWeight: 500 }}>By {featuredBook.author}</p>
              <p style={{ fontSize: '1rem', color: '#aaa', lineHeight: 1.7, marginBottom: '2.5rem' }}>{featuredBook.description}</p>

              <div className="store-hero-actions" style={{ display: 'flex', gap: '1.5rem' }}>
                  <button onClick={() => add(featuredBook)} style={{ padding: '1.25rem 3rem', background: '#D4A843', color: '#111', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 10px 30px rgba(212, 168, 67, 0.3)' }}>Buy Now • ₹{featuredBook.price}</button>
                  <Link to={`/e-store/view/${featuredBook.id}`} style={{ padding: '1.25rem 3rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', color: '#fff', textDecoration: 'none', fontWeight: 600, backdropFilter: 'blur(10px)', textAlign: 'center' }}>More Detail</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TRENDS */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff' }}>Trending Now</h2>
          <Link to="/e-store/shop" style={{ color: '#D4A843', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>View Collection <ArrowRight size={18} /></Link>
        </div>
        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '2rem', scrollbarWidth: 'none' }}>
          {trendingBooks.map((book) => (
            <Link to={`/e-store/view/${book.id}`} key={book.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <Motion.div whileHover={{ y: -10 }} style={{ width: '200px' }}>
                <img src={book.image} alt={book.name} style={{ width: '200px', height: '280px', objectFit: 'cover', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>{book.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>{book.author}</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#D4A843', marginTop: '0.5rem' }}>₹{book.price}</p>
              </Motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORY EXPLORER */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem 8rem' }}>
        <div style={{ borderTop: '1px solid #222', paddingTop: '5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '3rem' }}>Explore Categories</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.id)}
                style={{ 
                  padding: '1rem 2rem', 
                  background: activeCategory === cat.id ? '#D4A843' : '#1a1a1a', 
                  color: activeCategory === cat.id ? '#111' : '#888',
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
                  <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{book.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#D4A843', fontWeight: 600 }}>₹{book.price}</p>
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
