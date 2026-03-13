import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, Star, Filter, ShoppingBag, Loader2, MessageCircle } from 'lucide-react';
import { useCache } from '../context/Cache_Context';
import inventoryApi from '../api/inventoryApi';

const WHATSAPP_NUMBER = '918790699260';

const openWhatsApp = (p) => {
  const productUrl = `${window.location.origin}/e-store/view/${p.id}`;
  const msg = encodeURIComponent(
    `Hi! I'm interested in buying the physical book *"${p.name}"* by ${p.author} (₹${p.price}).

🔗 Product Link: ${productUrl}

Could you please guide me on the purchase process?`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
};


const Module_List = () => {
  const { add } = useCache();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const languageParam = searchParams.get('language') || 'all';
  const sortParam = searchParams.get('sort') || 'featured';
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const CATEGORY_LABELS = {
    'EBOOK': 'E-Books',
    'PHYSICAL': 'Physical Books',
  };

  const getCategoryLabel = (raw) => CATEGORY_LABELS[raw?.toUpperCase()] || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Other');

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
          category: b.bookCategory || 'OTHER',       // preserve original casing
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

  const filteredProducts = products
    .filter(p => {
      const matchesCategory = categoryParam === 'all' || p.category === categoryParam;
      const matchesLanguage = languageParam === 'all' || p.language === languageParam;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesLanguage && matchesSearch;
    })
    .sort((a, b) => {
      if (sortParam === 'price-low') return a.price - b.price;
      if (sortParam === 'price-high') return b.price - a.price;
      return 0;
    });

  const categories = [
    { id: 'all', label: 'All Books' },
    ...Array.from(new Set(products.map(p => p.category))).map(cat => ({
      id: cat,
      label: getCategoryLabel(cat)
    }))
  ].map(cat => ({
    ...cat,
    count: cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id).length
  }));

  if (loading) return (
    <div style={{ padding: '15rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
      <Loader2 size={48} style={{ margin: '0 auto 1.5rem', color: '#D4A843' }} />
      <p style={{ color: '#666', fontSize: '1.2rem' }}>Curating your collection...</p>
    </div>
  );

  return (
    <div style={{ paddingTop: '7rem', paddingBottom: '5rem', background: '#111', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div className="store-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
          <Motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="store-list-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-1px' }}>The Collection</h1>
            <p style={{ color: '#555', fontSize: '1rem' }}>Showing {filteredProducts.length} high-quality professional titles</p>
          </Motion.div>

          <div className="store-list-filters" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
              <input 
                type="text" 
                placeholder="Search title or author..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '100px', padding: '0.85rem 1.5rem 0.85rem 3.5rem', color: '#fff', width: '320px', outline: 'none', fontSize: '0.9rem', transition: 'all 0.3s' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(212, 168, 67, 0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
              />
            </div>
            <select 
              value={sortParam}
              onChange={(e) => setSearchParams({ category: categoryParam, language: languageParam, sort: e.target.value })}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '100px', padding: '0.85rem 1.5rem', color: '#aaa', outline: 'none', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.3s' }}
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="store-list-container" style={{ display: 'flex', gap: '3rem' }}>
          <aside className="store-list-sidebar" style={{ width: '280px', flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.03)', position: 'sticky', top: '10rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4A843', marginBottom: '1.75rem', textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.8 }}>Specializations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '3rem' }}>
                  {categories.map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSearchParams({ category: cat.id, language: languageParam, sort: sortParam })} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.25rem', 
                        borderRadius: '0.85rem', 
                        background: categoryParam === cat.id ? 'rgba(212, 168, 67, 0.12)' : 'transparent', 
                        color: categoryParam === cat.id ? '#D4A843' : '#666', 
                        border: 'none', 
                        cursor: 'pointer', 
                        textAlign: 'left',
                        fontWeight: categoryParam === cat.id ? 800 : 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => { if(categoryParam !== cat.id) e.target.style.color = '#888'; }}
                      onMouseLeave={(e) => { if(categoryParam !== cat.id) e.target.style.color = '#666'; }}
                    >
                      <span>{cat.label}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{cat.count}</span>
                    </button>
                  ))}
              </div>

              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4A843', marginBottom: '1.75rem', textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.8 }}>Languages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['all', ...Array.from(new Set(products.map(p => p.language))).filter(Boolean)].map((lang) => (
                    <button 
                      key={lang} 
                      onClick={() => setSearchParams({ category: categoryParam, language: lang, sort: sortParam })} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.25rem', 
                        borderRadius: '0.85rem', 
                        background: languageParam === lang ? 'rgba(212, 168, 67, 0.12)' : 'transparent', 
                        color: languageParam === lang ? '#D4A843' : '#666', 
                        border: 'none', 
                        cursor: 'pointer', 
                        textAlign: 'left',
                        fontWeight: languageParam === lang ? 800 : 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => { if(languageParam !== lang) e.target.style.color = '#888'; }}
                      onMouseLeave={(e) => { if(languageParam !== lang) e.target.style.color = '#666'; }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{lang === 'all' ? 'Universal' : lang.toLowerCase()}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                        {lang === 'all' ? products.length : products.filter(p => p.language === lang).length}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </aside>

          <div style={{ flexGrow: 1 }}>
            <div className="store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '2rem' }}>
              <AnimatePresence>
                {filteredProducts.map((p, idx) => (
                  <Motion.div 
                    key={p.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.03, ease: [0.23, 1, 0.32, 1] }}
                    style={{ 
                      background: 'rgba(255,255,255,0.01)', 
                      borderRadius: '1.25rem', 
                      overflow: 'hidden', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                      position: 'relative'
                    }}
                    whileHover={{ 
                      y: -12, 
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(212, 168, 67, 0.25)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <Link to={`/e-store/view/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }} className="store-card-img" />
                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#D4A843', border: '1px solid rgba(212, 168, 67, 0.2)', textTransform: 'uppercase' }}>
                          {p.category}
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '1.25rem', fontWeight: 500 }}>{p.author}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#D4A843', fontWeight: 800, fontSize: '1.15rem' }}>₹{p.price}</span>
                          <span style={{ fontSize: '0.6rem', color: '#333', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.category?.toUpperCase() === 'PHYSICAL' ? 'Physical Book' : 'Premium Edition'}</span>
                        </div>
                        {p.category?.toUpperCase() === 'PHYSICAL' ? (
                          <button 
                            onClick={() => openWhatsApp(p)} 
                            title="Order via WhatsApp"
                            style={{ 
                              background: 'rgba(37, 211, 102, 0.1)', 
                              border: '1px solid rgba(37, 211, 102, 0.25)', 
                              borderRadius: '0.75rem', 
                              width: '42px', 
                              height: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#25D366'; e.currentTarget.querySelector('svg').style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)'; e.currentTarget.querySelector('svg').style.color = '#25D366'; }}
                          >
                            <MessageCircle size={18} color="#25D366" style={{ transition: 'color 0.3s' }} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => add(p)} 
                            style={{ 
                              background: 'rgba(212, 168, 67, 0.1)', 
                              border: '1px solid rgba(212, 168, 67, 0.2)', 
                              borderRadius: '0.75rem', 
                              width: '42px', 
                              height: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#D4A843';
                              e.currentTarget.querySelector('svg').style.color = '#111';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(212, 168, 67, 0.1)';
                              e.currentTarget.querySelector('svg').style.color = '#D4A843';
                            }}
                          >
                            <ShoppingBag size={18} color="#D4A843" style={{ transition: 'color 0.3s' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '10rem 0', color: '#444' }}>
                <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <h3>No books found matching your criteria</h3>
              </div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
          .store-grid { margin-top: 1rem; }
          .store-card-img:hover { transform: scale(1.08); }
          input::placeholder { color: #333; }
          select option { background: #111; color: #fff; }
          aside::-webkit-scrollbar { width: 4px; }
          aside::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Module_List;
