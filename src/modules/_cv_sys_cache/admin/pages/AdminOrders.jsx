import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import inventoryApi from '../../api/inventoryApi';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [statusFilter, setStatusFilter] = useState(''); // '' means All
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination States
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Invoice States
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    
    // Sentinel Ref for Infinite Scroll
    const loaderRef = useRef(null);
    const ordersRef = useRef([]);

    // Sync ordersRef with orders state
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    const fetchOrders = useCallback(async (isInitial = true) => {
        if (isInitial) {
            setLoading(true);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            
            // If loading more, send the last orderId as cursor
            if (!isInitial && ordersRef.current.length > 0) {
                params.cursor = ordersRef.current[ordersRef.current.length - 1].orderId;
            }
            
            const res = await inventoryApi.get('admin/orders/get/all/orders/admin', { params });
            const newOrders = res.data || [];
            
            if (isInitial) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }

            // If we got fewer than 10 items (backend limit), there's no more
            if (newOrders.length < 10) {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [statusFilter]); // stable!

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchOrders(false);
        }
    };

    useEffect(() => {
        fetchOrders(true);
    }, [statusFilter, fetchOrders]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                fetchOrders(false);
            }
        }, { threshold: 0.1, rootMargin: '100px' });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, fetchOrders]);

    // Client-side filtering for search
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderId.toString().includes(searchTerm) || 
            order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleViewItems = async (orderId) => {
        if (selectedOrder === orderId) {
            setSelectedOrder(null);
            return;
        }
        
        setSelectedOrder(orderId);
        setLoadingItems(true);
        try {
            const res = await inventoryApi.get(`admin/orders/${orderId}/items`);
            setOrderItems(res.data || []);
        } catch (err) {
            console.error("Failed to fetch order items", err);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewInvoice = async (orderId) => {
        setLoadingInvoice(true);
        setIsInvoiceOpen(true);
        try {
            const res = await inventoryApi.get(`invoices/${orderId}`);
            setInvoiceData(res.data);
        } catch (err) {
            console.error("Failed to fetch invoice", err);
        } finally {
            setLoadingInvoice(false);
        }
    };

    const printInvoice = () => {
        window.print();
    };

    return (
        <div className="admin-orders-container">
            <div className="um-header no-print">
                <div className="um-header-content">
                    <div className="um-title-section">
                        <h1 className="um-title">
                            <i className="fas fa-shopping-cart"></i>
                            Order Management
                        </h1>
                        <p className="um subtitle">View and manage customer orders</p>
                    </div>
                    <div className="um-header-search">
                        <div className="um-search-wrapper">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="Search by Order ID or Email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="um-search-clear" onClick={() => setSearchTerm('')}>
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Filter Bar */}
            <div className="um-filter-bar orders-filter no-print">
                <div className="um-tabs compact">
                    {[
                        { label: 'All Orders', value: '' },
                        { label: 'Paid', value: 'PAID' },
                        { label: 'Pending', value: 'PENDING' },
                        { label: 'Expired', value: 'EXPIRED' }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            className={`um-tab ${statusFilter === tab.value ? 'active' : ''}`}
                            onClick={() => setStatusFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="um-filter-results">
                    {searchTerm && <span className="um-results-count">{filteredOrders.length} results found</span>}
                </div>
            </div>

            {loading ? (
                <div className="um-loading">
                    <div className="um-spinner"></div>
                    <p>Fetching orders...</p>
                </div>
            ) : (
                <div className="um-table-container no-print">
                    <table className="um-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Email</th>
                                <th>Date</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="um-empty-state" style={{ padding: '4rem 0' }}>
                                        <i className="fas fa-box-open" style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '1rem', display: 'block' }}></i>
                                        <p>{searchTerm ? 'No matching orders found' : `No ${statusFilter.toLowerCase()} orders placed yet`}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <React.Fragment key={order.orderId}>
                                        <tr className={`um-table-row um-order-row ${selectedOrder === order.orderId ? 'selected' : ''}`}>
                                            <td className="um-order-id">#{order.orderId}</td>
                                            <td>{order.userEmail}</td>
                                            <td>
                                                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="um-order-price">₹{order.totalAmount}</td>
                                            <td>
                                                <span className={`um-status-badge ${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => handleViewItems(order.orderId)}
                                                        className="um-view-items-btn"
                                                        title="View Items"
                                                    >
                                                        <i className={`fas fa-eye`}></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleViewInvoice(order.orderId)}
                                                        className="um-view-items-btn"
                                                        style={{ background: 'rgba(98, 38, 158, 0.1)', color: '#62269E' }}
                                                        title="View Invoice"
                                                    >
                                                        <i className="fas fa-file-invoice-dollar"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {selectedOrder === order.orderId && (
                                                <Motion.tr 
                                                    className="um-detail-row"
                                                    initial={{ opacity: 0, height: 0 }} 
                                                    animate={{ opacity: 1, height: 'auto' }} 
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    <td colSpan={6} className="um-detail-container-cell">
                                                        <div className="um-detail-area">
                                                            <h4 className="um-detail-title">Order Line Items</h4>
                                                            {loadingItems ? (
                                                                <div className="um-detail-loading">Loading items...</div>
                                                            ) : orderItems.length === 0 ? (
                                                                <div className="um-detail-empty">No items found for this order.</div>
                                                            ) : (
                                                                <div className="um-item-list">
                                                                    {orderItems.map((item, idx) => (
                                                                        <div key={idx} className="um-item-card">
                                                                            <div className="um-book-cover">
                                                                                {item.coverPhotoUrl ? (
                                                                                    <img src={item.coverPhotoUrl} alt="cover" />
                                                                                ) : (
                                                                                    <div className="um-cover-placeholder">
                                                                                        <i className="fas fa-image"></i>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="um-item-info">
                                                                                <h5 className="um-item-name">{item.bookName}</h5>
                                                                                <p className="um-item-subtext">Est. Unit Price: ₹{item.price}</p>
                                                                            </div>
                                                                            <div className="um-item-qty">
                                                                                <span className="qty-label">Qty</span>
                                                                                <span className="qty-value">x{item.quantity}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </Motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Scroll Sentinel & Loading Hook */}
                    <div ref={loaderRef} className="um-load-more-section no-print">
                        {loadingMore && (
                            <div className="um-infinite-loader">
                                <i className="fas fa-spinner fa-spin"></i>
                                Loading more orders...
                            </div>
                        )}
                        {!hasMore && orders.length > 0 && (
                            <div className="um-no-more">
                                <p>You've reached the end of the list</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            <AnimatePresence>
                {isInvoiceOpen && (
                    <div className="um-modal-overlay">
                        <Motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="um-modal invoice-modal"
                            style={{ maxWidth: '800px', width: '95%' }}
                        >
                            <div className="um-modal-header no-print">
                                <h2 className="um-modal-title">Order Invoice</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="um-btn-cancel" onClick={printInvoice}>
                                        <i className="fas fa-print"></i> Print
                                    </button>
                                    <button className="um-modal-close" onClick={() => setIsInvoiceOpen(false)}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="um-modal-body">
                                {loadingInvoice ? (
                                    <div className="um-loading" style={{ height: '300px' }}>
                                        <div className="um-spinner"></div>
                                        <p>Generating Invoice...</p>
                                    </div>
                                ) : invoiceData ? (
                                    <div className="invoice-content" id="printable-invoice">
                                        <div className="invoice-header">
                                            <div className="brand-section">
                                                <h1 style={{ color: '#62269E', margin: 0 }}>CAREER VEDHA</h1>
                                                <p className="um-item-subtext">Official Order Receipt</p>
                                            </div>
                                            <div className="order-meta">
                                                <p><strong>Order ID:</strong> #CV-{invoiceData.orderId}</p>
                                                <p><strong>Date:</strong> {new Date(invoiceData.createdAt).toLocaleDateString()}</p>
                                                <p><strong>Customer:</strong> {invoiceData.userEmail}</p>
                                            </div>
                                        </div>

                                        <table className="invoice-table">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Price</th>
                                                    <th>Qty</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceData.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.bookName}</td>
                                                        <td>₹{item.price}</td>
                                                        <td>{item.quantity}</td>
                                                        <td style={{ textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div className="invoice-summary">
                                            <div className="summary-row">
                                                <span>Subtotal</span>
                                                <span>₹{invoiceData.subTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span>GST ({invoiceData.gstPercentage}%)</span>
                                                <span>₹{invoiceData.gstAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="summary-row total">
                                                <span>Grand Total</span>
                                                <span>₹{invoiceData.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="invoice-footer">
                                            <p>Thank you for choosing Career Vedha!</p>
                                            <p className="um-item-subtext">This is a system-generated invoice.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="um-empty-state">Failed to load invoice data.</div>
                                )}
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrders;
