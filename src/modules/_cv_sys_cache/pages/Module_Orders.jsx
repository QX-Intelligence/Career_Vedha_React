import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import inventoryApi from '../api/inventoryApi';

const Module_Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await inventoryApi.get('/orders/my/orders');
        const normalized = res.data.map(order => ({
          id: `#CV-${order.orderId}`,
          rawId: order.orderId,
          date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rawCreatedAt: order.createdAt,
          expiryTime: order.expiryTime,
          total: order.totalAmount,
          status: order.status,
          items: 'Multiple'
        }));
        setOrders(normalized);
      } catch (e) {
        console.error("Failed to fetch order history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return (
    <div style={{ padding: '15rem 0', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', color: '#0F172A' }}>
      <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#62269e' }} />
      <p style={{ color: '#475569', fontSize: '1.2rem', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>Retrieving your history...</p>
    </div>
  );

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', color: '#0F172A', marginBottom: '3rem', fontWeight: 800 }}>Your Orders</h1>
        
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {orders.map((order, i) => (
            <Link to={`/e-store/orders/${order.rawId}`} key={order.id} style={{ textDecoration: 'none' }}>
              <Motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="store-orders-row"
                style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                whileHover={{ scale: 1.01, border: '1px solid rgba(98, 38, 158, 0.3)' }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ width: '50px', height: '50px', background: 'rgba(98,38,158,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#62269e', flexShrink: 0, border: '1px solid rgba(98,38,158,0.15)' }}>
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="store-orders-status-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ color: '#0F172A', fontSize: '1.1rem' }}>{order.id}</h3>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.6rem', 
                        background: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.1)' : (order.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)'), 
                        color: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? '#10b981' : (order.status === 'FAILED' ? '#ff4d4d' : '#888'), 
                        borderRadius: '100px', 
                        fontWeight: 800,
                        border: order.status === 'FAILED' ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', items: 'center', gap: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {order.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="store-orders-totals-mobile" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '0.1rem' }}>Amount</p>
                    <p style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>₹{order.total}</p>
                  </div>
                  {order.status === 'FAILED' && (() => {
                    const expiry = order.expiryTime ? new Date(order.expiryTime) : 
                                   (new Date(order.rawCreatedAt).getTime() + 15 * 60000);
                    return new Date(expiry) > new Date();
                  })() ? (
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(98, 38, 158, 0.12)', color: '#62269e', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(98, 38, 158, 0.3)' }}>
                      RETRY
                    </div>
                  ) : (
                    <ChevronRight size={20} color="#62269e" />
                  )}
                </div>
              </Motion.div>
            </Link>
          ))}
        </div>

        {orders.length === 0 && (
          <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
             <p style={{ color: '#64748b' }}>No orders found in your history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Module_Orders;
