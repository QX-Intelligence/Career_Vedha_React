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
            setError(null);

            // 1. Trigger backend retry to release inventory and create new order
            const retryRes = await inventoryApi.post(`/payment/retry/${id}`);
            const newOrderId = retryRes.data; // Backend returns the new orderId

            if (!newOrderId) {
                throw new Error("Failed to generate a new order ID for retry.");
            }

            // 2. Persist for recovery in case of refresh during polling
            sessionStorage.setItem("currentOrderId", newOrderId);
            sessionStorage.setItem("retryTotal", order.totalAmount);

            // 3. Navigate to process page with retry context
            // Pass total since /orders/my/orders won't show PENDING orders
            navigate(`/e-store/process?orderId=${newOrderId}&isRetry=true&total=${order.totalAmount}`);
        } catch (err) {
            console.error("Retry failed", err);
            const msg = err.response?.data?.message || err.response?.data || err.message || "Failed to initiate retry. Please try again later.";
            setError(typeof msg === 'string' ? msg : "Failed to initiate retry. Please try again later.");
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
        <div style={{ padding: '15rem 0', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', color: '#0F172A' }}>
            <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: '#62269e' }} />
            <p style={{ color: '#475569', fontSize: '1.2rem', fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>Loading order details...</p>
        </div>
    );

    if (error || !order) return (
        <div style={{ padding: '15rem 0', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', color: '#0F172A' }}>
            <p style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '1rem' }}>{error || "Order not found"}</p>
            <button onClick={() => navigate('/e-store/orders')} style={{ padding: '0.75rem 1.5rem', background: '#FFFFFF', border: '1px solid #e2e8f0', color: '#0F172A', borderRadius: '0.5rem', cursor: 'pointer' }}>Back to Orders</button>
        </div>
    );

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Date';

    // Retry only allowed for FAILED or INVENTORY_RESERVED (unpaid) orders.
    // Explicitly hide if status is REPLACED (already retried).
    // Limit retry window to 15 minutes after failure (or based on expiryTime).
    const isExpired = (() => {
        if (!order.createdAt) return false;
        const expiry = order.expiryTime ? new Date(order.expiryTime) : 
                     (order.status === 'FAILED' ? new Date(new Date(order.createdAt).getTime() + 15 * 60000) : null);
        return expiry ? expiry < new Date() : false;
    })();

    const canRetry = (order.status === 'FAILED' || order.status === 'INVENTORY_RESERVED') && order.status !== 'REPLACED' && !isExpired;

    return (
        <div style={{ paddingTop: '8rem', paddingBottom: '5rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                <Link to="/e-store/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontWeight: 500, marginBottom: '2rem', textDecoration: 'none', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Back to Orders
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', color: '#0F172A', marginBottom: '0.5rem', fontWeight: 800 }}>Order #CV-{order.orderId}</h1>
                        <p style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Placed on {formattedDate}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', background: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(98, 38, 158, 0.12)', color: order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'DELIVERED' ? '#10b981' : order.status === 'FAILED' ? '#ef4444' : '#62269e', borderRadius: '100px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {order.status}
                        </span>
                        {canRetry ? (
                            <button
                                onClick={handleRetry}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1.25rem',
                                    background: loading ? '#333' : '#62269e',
                                    color: loading ? '#666' : '#fff',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 8px 16px rgba(98, 38, 158, 0.25)'
                                }}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                                RETRY PAYMENT
                            </button>
                        ) : (order.status === 'FAILED' || order.status === 'INVENTORY_RESERVED') && isExpired && (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                color: '#94A3B8', 
                                fontSize: '0.75rem', 
                                padding: '0.6rem 1rem', 
                                background: 'rgba(255,255,255,0.02)', 
                                borderRadius: '0.75rem', 
                                border: '1px solid rgba(0,0,0,0.05)',
                                fontWeight: 600,
                                letterSpacing: '0.5px'
                            }}>
                                <Clock size={14} /> RETRY WINDOW EXPIRED
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Items Section */}
                    <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <h3 style={{ color: '#0F172A', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                            <Package size={20} color="#62269e" /> Order Items
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {order.orderItems && order.orderItems.length > 0 ? (
                                order.orderItems.map((item, idx) => (
                                    <div key={idx} className="store-order-item" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', padding: '1.25rem', background: '#FDFBF7', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: '50px', height: '70px', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    {item.coverPhotoUrl ? (
                                                        <img src={item.coverPhotoUrl} alt={item.bookName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '24px', height: '24px', background: '#62269e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A', fontSize: '0.75rem', fontWeight: 800, border: '2px solid #FDFBF7' }}>
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div>
                                                <p style={{ color: '#0F172A', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.bookName || `Item #${item.bookId}`}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>₹{item.price}</p>
                                                    {item.bookCategory === 'EBOOK' && (
                                                        <span style={{ fontSize: '0.65rem', background: 'rgba(98, 38, 158, 0.12)', color: '#62269e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>E-Book</span>
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
                                                        color: '#62269e',
                                                        fontWeight: 800,
                                                        textDecoration: 'none',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid rgba(98, 38, 158, 0.3)',
                                                        background: 'rgba(98, 38, 158, 0.05)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="read-now-link"
                                                >
                                                    READ NOW
                                                </Link>
                                            )}
                                            <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem', minWidth: '80px', textAlign: 'right' }}>
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#64748B', padding: '1rem', background: '#FDFBF7', borderRadius: '0.5rem', textAlign: 'center' }}>No item details available. ({order.items === 'Multiple' ? 'Multiple items ordered' : 'Verify in system'})</p>
                            )}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="store-order-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                        <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h3 style={{ color: '#0F172A', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                <CreditCard size={20} color="#62269e" /> Payment Summary
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                    <span>Subtotal</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                    <span>Total Paid</span>
                                    <span style={{ color: '#62269e', fontWeight: 800 }}>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h3 style={{ color: '#0F172A', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                <MapPin size={20} color="#62269e" /> Order Details
                            </h3>
                            <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <p><strong style={{ color: '#475569' }}>Status:</strong> {order.status}</p>
                                <p><strong style={{ color: '#475569' }}>Payment Method:</strong> {order.paymentStrategy || 'Razorpay'}</p>
                                <p><strong style={{ color: '#475569' }}>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module_OrderDetail;