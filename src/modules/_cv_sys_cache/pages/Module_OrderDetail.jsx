import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, Loader2, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import inventoryApi from '../api/inventoryApi';

const Module_OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleRetry = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.post(`/payment/retry/${id}`);
            const newOrderId = res.data;
            navigate(`/e-store/process?orderId=${newOrderId}`);
        } catch (err) {
            console.error("Retry failed", err);
            setError("Failed to initiate retry. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // 1. Fetch from the orders list
                const listRes = await inventoryApi.get('/orders/my/orders');
                const foundOrder = listRes.data.find(o => String(o.orderId) === String(id));
                
                if (foundOrder) {
                    // 2. Fetch the specific items for this order
                    try {
                        const itemsRes = await inventoryApi.get(`/orders/${id}/items`);
                        foundOrder.orderItems = itemsRes.data;
                    } catch (itemsErr) {
                        console.error("Failed to fetch order line items", itemsErr);
                        foundOrder.orderItems = [];
                    }
                    setOrder(foundOrder);
                } else {
                    throw new Error("Order not found in your history.");
                }
            } catch (err) {
                console.error("Failed to fetch order details", err);
                setError(err.message || "Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return (
        <div style={{ padding: '15rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#D4A843' }} />
            <p style={{ color: '#666', fontSize: '1.2rem' }}>Loading order details...</p>
        </div>
    );

    if (error || !order) return (
        <div style={{ padding: '15rem 0', textAlign: 'center', background: '#111', minHeight: '100vh', color: '#fff' }}>
            <p style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '1rem' }}>{error || "Order not found"}</p>
            <button onClick={() => navigate('/e-store/orders')} style={{ padding: '0.75rem 1.5rem', background: '#333', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Back to Orders</button>
        </div>
    );

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Date';

    return (
        <div style={{ paddingTop: '8rem', paddingBottom: '5rem', background: '#111', minHeight: '100vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                <Link to="/e-store/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontWeight: 500, marginBottom: '2rem', textDecoration: 'none', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Back to Orders
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem' }}>Order #CV-{order.orderId}</h1>
                        <p style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Placed on {formattedDate}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', background: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 168, 67, 0.1)', color: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? '#10b981' : order.status === 'FAILED' ? '#ef4444' : '#D4A843', borderRadius: '100px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {order.status}
                        </span>
                        {order.status === 'FAILED' && (
                            <button 
                                onClick={handleRetry}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1.25rem',
                                    background: '#D4A843',
                                    color: '#111',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 16px rgba(212, 168, 67, 0.25)'
                                }}
                            >
                                <RefreshCw size={16} /> RETRY PAYMENT
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Items Section */}
                    <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={20} color="#D4A843" /> Order Items
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {order.orderItems && order.orderItems.length > 0 ? (
                                order.orderItems.map((item, idx) => (
                                    <div key={idx} className="store-order-item" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', padding: '1.25rem', background: '#111', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: '50px', height: '70px', background: '#222', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {item.coverPhotoUrl ? (
                                                        <img src={item.coverPhotoUrl} alt={item.bookName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '24px', height: '24px', background: '#D4A843', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.75rem', fontWeight: 800, border: '2px solid #111' }}>
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div>
                                                <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.bookName || `Item #${item.bookId}`}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <p style={{ color: '#666', fontSize: '0.85rem' }}>₹{item.price}</p>
                                                    {item.bookCategory === 'EBOOK' && (
                                                        <span style={{ fontSize: '0.65rem', background: 'rgba(212, 168, 67, 0.1)', color: '#D4A843', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>E-Book</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            {(order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED') && item.bookCategory === 'EBOOK' && (
                                                <Link 
                                                    to="/e-store/library" 
                                                    state={{ highlightId: item.bookId }}
                                                    style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#D4A843', 
                                                        fontWeight: 700, 
                                                        textDecoration: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid rgba(212, 168, 67, 0.3)',
                                                        background: 'rgba(212, 168, 67, 0.05)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="read-now-link"
                                                >
                                                    READ NOW
                                                </Link>
                                            )}
                                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', minWidth: '80px', textAlign: 'right' }}>
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#888', padding: '1rem', background: '#111', borderRadius: '0.5rem', textAlign: 'center' }}>No item details available. ({order.items === 'Multiple' ? 'Multiple items ordered' : 'Verify in system'})</p>
                            )}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="store-order-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                        <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CreditCard size={20} color="#D4A843" /> Payment Summary
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                                    <span>Subtotal</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span>Total Paid</span>
                                    <span style={{ color: '#D4A843' }}>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={20} color="#D4A843" /> Order Details
                            </h3>
                            <div style={{ color: '#888', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <p><strong style={{ color: '#aaa' }}>Status:</strong> {order.status}</p>
                                <p><strong style={{ color: '#aaa' }}>Payment Method:</strong> {order.paymentStrategy || 'Razorpay'}</p>
                                <p><strong style={{ color: '#aaa' }}>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module_OrderDetail;
