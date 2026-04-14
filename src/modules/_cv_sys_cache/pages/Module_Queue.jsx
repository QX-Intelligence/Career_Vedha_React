import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, ShoppingBag, Minus, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCache } from '../context/Cache_Context';

const Module_Queue = () => {
  const { items, remove, update, count, summary } = useCache();

  // Reset any pending checkout session when landing on the cart.
  // This ensures that clicking "Proceed to Checkout" always starts a fresh order.
  React.useEffect(() => {
    sessionStorage.removeItem("currentOrderId");
    sessionStorage.removeItem("retryTotal");
  }, []);
  
  // Dynamic values from backend
  const subTotal = summary.subTotal || 0;
  const tax = summary.gstAmount || 0;
  const grandTotal = summary.totalAmount || 0;
  const shipping = 0; // Backend currently does not provide shipping

  if (items.length === 0) return (
    <div style={{ padding: '12rem 1.5rem', textAlign: 'center', color: '#475569', background: '#0c0216', minHeight: '100vh' }}>
      <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <ShoppingBag size={80} style={{ marginBottom: '2rem', opacity: 0.1, color: '#62269e' }} />
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', color: '#0F172A', marginBottom: '1rem', fontWeight: 800 }}>Your Library is Empty</h2>
        <p style={{ marginBottom: '2.5rem', color: '#94A3B8' }}>Looks like you haven't added any premium titles yet.</p>
        <Link to="/e-store/shop" style={{ padding: '1rem 2.5rem', background: '#62269e', color: '#0F172A', fontWeight: 700, borderRadius: '100px', textDecoration: 'none', display: 'inline-block' }}>
          Browse Collection
        </Link>
      </Motion.div>
    </div>
  );

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#0c0216', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '3rem', color: '#0F172A', fontWeight: 800 }}>Your Cart</h1>
          <span style={{ padding: '0.25rem 0.75rem', background: '#FFFFFF', border: '1px solid #222', borderRadius: '100px', color: '#62269e', fontSize: '0.8rem', fontWeight: 800 }}>{count} ITEMS</span>
        </div>

        <div className="store-queue-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
          {/* Items List */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <AnimatePresence>
              {items.map(i => (
                <Motion.div 
                  key={i.id || Math.random()} 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="store-queue-item"
                  style={{ display: 'flex', gap: '2rem', background: '#FFFFFF', padding: '1.5rem', borderRadius: '1.25rem', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <img src={i.image} className="store-queue-item-img" style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '0.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} alt="" />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#0F172A', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{i.name}</h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1rem' }}>{i.author}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#FDFBF7', borderRadius: '100px', padding: '0.25rem', border: '1px solid #222' }}>
                        <button onClick={() => update(i.id, i.qty - 1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', color: '#0F172A', cursor: 'pointer' }}><Minus size={14} /></button>
                        <span style={{ width: '40px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{i.qty}</span>
                        <button onClick={() => update(i.id, i.qty + 1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', color: '#0F172A', cursor: 'pointer' }}><Plus size={14} /></button>
                      </div>
                      <span style={{ color: '#62269e', fontWeight: 800, fontSize: '1.1rem' }}>₹{i.price * i.qty}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </Motion.div>
              ))}
            </AnimatePresence>

            <Link to="/e-store/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', textDecoration: 'none', marginTop: '1rem', fontWeight: 500 }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <aside style={{ position: 'sticky', top: '10rem' }}>
            <div style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#0F172A', fontSize: '1.75rem', marginBottom: '2rem', fontWeight: 700 }}>Order Summary</h2>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #222', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Subtotal ({count} items)</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>₹{subTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Shipping</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>GST ({summary?.gstPercentage || 0}%)</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>₹{tax}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <span style={{ color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Total Amount</span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#62269e', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>₹{grandTotal}</p>
                </div>
              </div>

              <Link to="/e-store/process" style={{ width: '100%', padding: '1.25rem', background: '#62269e', color: '#0F172A', fontWeight: 800, borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
              
              <p style={{ textAlign: 'center', color: '#444', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> SSL Secure Checkout
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Module_Queue;
